import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { MoreLoginClient } from "@/lib/morelogin";

// 定义返回给前端的日志/状态结构
type StreamEvent = 
  | { type: "log"; message: string }
  | { status: "success"; message: string; token?: string; info?: any }
  | { status: "error"; message: string }
  | { status: "action_required"; reason: string; info?: any };

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const body = await req.json();
  
  // 解构参数
  const { 
    token: discordToken,
    moreLoginProfileId, 
    moreLoginApiUrl, 
    moreLoginAppId,
    moreLoginSecretKey,
    autoMatchProfile,
    profileSearchTerm,
    closeAfterLogin
  } = body;

  const stream = new ReadableStream({
    async start(controller) {
      // 辅助函数：发送事件到前端
      const sendEvent = (data: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch (e) {
          // Stream closed
        }
      };

      let browser;
      let moreLoginClient;
      let profileId = moreLoginProfileId;

      try {
        // --- 1. 参数校验 ---
        if (!discordToken) {
          throw new Error("缺少 Token，请提供 Discord Token");
        }

        if (!moreLoginAppId || !moreLoginSecretKey) {
          throw new Error("缺少 MoreLogin 授权信息 (App ID / Secret Key)");
        }

        // --- 2. 初始化 MoreLogin ---
        sendEvent({ type: "log", message: "正在连接 MoreLogin..." });
        moreLoginClient = new MoreLoginClient(moreLoginApiUrl, moreLoginAppId, moreLoginSecretKey);

        // 自动匹配环境逻辑
        if (autoMatchProfile) {
            const searchTerm = profileSearchTerm || "Discord"; // 默认搜索词
            sendEvent({ type: "log", message: `正在搜索环境: ${searchTerm}` });
            const profiles = await moreLoginClient.getProfileList(1, 100);
            const matched = profiles.find((p: any) => {
                const name = p.envName || p.name;
                return name && name.includes(searchTerm);
            });
            if (matched) {
                profileId = String(matched.id || matched.Id || matched.envId);
                sendEvent({ type: "log", message: `已匹配环境: ${matched.envName || matched.name} (${profileId})` });
            } else {
                throw new Error(`未找到包含 "${searchTerm}" 的环境`);
            }
        } else {
            // 如果传入的不是纯数字ID，尝试按名称查找
            if (profileId && !/^\d+$/.test(profileId)) {
                try {
                    const profiles = await moreLoginClient.getProfileList(1, 100);
                    const matched = profiles.find((p: any) => (p.envName || p.name) === profileId);
                    if (matched) {
                        profileId = String(matched.id || matched.Id || matched.envId);
                        sendEvent({ type: "log", message: `通过名称找到环境 ID: ${profileId}` });
                    }
                } catch (e) {}
            }
        }

        if (!profileId) throw new Error("未指定环境 ID");

        // --- 3. 启动浏览器 ---
        sendEvent({ type: "log", message: `正在启动环境 ${profileId}...` });
        
        let browserInfo;
        try {
            browserInfo = await moreLoginClient.startProfile(profileId);
        } catch (e: any) {
            throw new Error(`启动环境失败: ${e.message}`);
        }

        if (!browserInfo?.wsEndpoint) throw new Error("无法获取浏览器 WebSocket 地址");

        sendEvent({ type: "log", message: "环境已启动，正在连接 Puppeteer..." });
        
        try {
            browser = await puppeteer.connect({
                browserWSEndpoint: browserInfo.wsEndpoint,
                defaultViewport: null,
                protocolTimeout: 120000, // 120s
            });
        } catch (e: any) {
            throw new Error(`Puppeteer 连接失败: ${e.message}`);
        }

        // 优先复用现有页面，而不是新建，以提高稳定性
        const pages = await browser.pages();
        let page;
        if (pages.length > 0) {
            page = pages[0];
            try { await page.bringToFront(); } catch(e) {}
            sendEvent({ type: "log", message: "复用现有浏览器标签页" });
        } else {
            page = await browser.newPage();
            sendEvent({ type: "log", message: "新建浏览器标签页" });
        }
        
        // 关闭多余页面 (如果有)
        for (let i = 1; i < pages.length; i++) {
            pages[i].close().catch(() => {});
        }

        // --- NEW: 网络请求监听 (最准确的检测方式) ---
        let networkUserInfo: any = null;
        let isTokenInvalid = false; // 标记 Token 是否无效

        page.on('response', async (response) => {
            try {
                const url = response.url();
                // 监听 /users/@me 接口响应
                if ((url.includes('/users/@me') || url.includes('/users/%40me')) && !url.includes('/library')) {
                    const status = response.status();
                    sendEvent({ type: "log", message: `[Debug] 捕获请求: ${url} Status: ${status}` });
                    
                    if (status === 200) {
                        try {
                            const data = await response.json();
                            if (data && (data.username || data.id)) {
                                networkUserInfo = data;
                                sendEvent({ type: "log", message: `[Network] 捕获到用户信息: ${data.username}` });
                            }
                        } catch(e) {}
                    } else if (status === 401 || status === 403) {
                        // 捕获到 401/403，说明 Token 确实无效
                        isTokenInvalid = true;
                    }
                }
            } catch (e) {}
        });

        // --- 4. 核心登录流程 (重构版) ---
        
        // 步骤 A: 访问 Discord 域 (建立 localStorage 作用域)
        sendEvent({ type: "log", message: "正在初始化 Discord 页面..." });
        try {
            // 我们只关心是否触发了导航，不关心资源是否加载完成
            // 设置较短超时，防止卡死
            await page.goto("https://discord.com/login", { waitUntil: "domcontentloaded", timeout: 15000 });
        } catch (e: any) {
            // 忽略导航超时，只要页面在加载中即可
            sendEvent({ type: "log", message: "页面加载请求已发送，准备注入..." });
        }

        // 步骤 B: 注入 Token
        sendEvent({ type: "log", message: "正在注入 Token..." });
        await page.evaluate((t) => {
            // 使用 iframe 技巧确保写入正确的 localStorage
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            // @ts-ignore
            const storage = iframe.contentWindow.localStorage;
            storage.setItem("token", `"${t}"`);
            document.body.removeChild(iframe);
        }, discordToken);

        // 步骤 C: 刷新/跳转并等待验证
        sendEvent({ type: "log", message: "Token 已注入，正在验证登录状态..." });
        
        // 强制跳转到应用页
        await page.evaluate(() => {
            window.location.replace("https://discord.com/channels/@me");
        });

        // 步骤 D: 智能验证循环 (Retry Logic)
        // 目标：等待 URL 变更为 /channels/ 或 /app，并且能获取到用户信息
        let loginSuccess = false;
        let userInfo = null;
        const maxRetries = 60; // 增加到 60 次 (约 120秒)，适应慢速代理
        
        // 初始等待：给页面一点时间加载资源，避免刚跳转就检测导致空值
        await new Promise(r => setTimeout(r, 5000)); // 增加初始等待到 5秒

        for (let i = 0; i < maxRetries; i++) {
            await new Promise(r => setTimeout(r, 2000)); // 每次间隔 2 秒

            let currentUrl = "";
            try {
                currentUrl = page.url();
            } catch (e) {
                // 页面可能已关闭
                break;
            }
            
            // 1. 优先检查网络请求捕获 (最快最准)
            if (networkUserInfo) {
                userInfo = { 
                    username: networkUserInfo.username, 
                    discriminator: networkUserInfo.discriminator || "0",
                    id: networkUserInfo.id
                };
                loginSuccess = true;
                sendEvent({ type: "log", message: `通过网络请求捕获用户信息: ${userInfo.username}` });
                break;
            }

            // 1.5 检查是否明确捕获到 401/403 (Token 无效)
            // 注意：有些账号虽然 API 返回 401，但页面依然能正常加载 (可能是风控或验证状态)
            // 用户反馈只要页面跳转了就算成功，所以这里不再直接抛出错误，而是作为标记
            if (isTokenInvalid) {
                 // 仅记录日志，不中断，交给后续 URL 检测来判定
                 if (i % 5 === 0) sendEvent({ type: "log", message: "警告: API 返回 401/403，账号可能受限" });
            }

            // 2. 检查 URL 是否正确
            if (currentUrl.includes("/login")) {
                // 如果还在登录页，可能是 Token 无效被踢回，或者还没跳转
                // 给更多时间让它跳转，特别是代理慢的时候
                if (i > 15) { // 增加到 30秒还在 login 才判定失败
                    throw new Error("Token 无效或网络过慢，长时间停留在登录页");
                }
                if (i % 5 === 0) {
                     sendEvent({ type: "log", message: `正在等待跳转... (${i+1}/${maxRetries})` });
                }
                continue;
            }

            if (currentUrl.includes("/channels/") || currentUrl.includes("/app")) {
                // URL 正确，尝试通过检查 LocalStorage 中的 user_id_cache 或 MultiAccountStore 来验证登录
                if (i % 5 === 0) {
                    sendEvent({ type: "log", message: `页面已跳转，正在检查 LocalStorage 用户信息 (${i+1}/${maxRetries})...` });
                }
                
                try {
                    // --- 方法 0: 主动 Fetch (最稳妥) ---
                    // 如果页面已加载，直接利用当前 Session 请求 API 获取用户信息
                    const fetchResult = await page.evaluate(async () => {
                        try {
                            // 必须手动携带 Authorization 头，否则会返回 401
                            // 使用 iframe 技巧获取 localStorage (规避某些页面重写)
                            const iframe = document.createElement('iframe');
                            document.body.appendChild(iframe);
                            // @ts-ignore
                            const rawToken = iframe.contentWindow.localStorage.getItem("token");
                            document.body.removeChild(iframe);

                            if (!rawToken) return null;
                            const token = rawToken.replace(/^"|"$/g, ''); // 去除首尾引号

                            const res = await fetch('/api/v9/users/@me', {
                                headers: {
                                    "Authorization": token,
                                    "Content-Type": "application/json"
                                }
                            });
                            
                            if (res.ok) {
                                const data = await res.json();
                                return { username: data.username, discriminator: data.discriminator, id: data.id };
                            }
                        } catch (e) {}
                        return null;
                    });

                    if (fetchResult) {
                        userInfo = fetchResult;
                        loginSuccess = true;
                        sendEvent({ type: "log", message: `通过主动 API 请求获取用户信息: ${userInfo.username}` });
                        break;
                    }

                    // 尝试从所有 Frame (包括 iframe) 中查找用户信息
                    let foundUserInfo: any = null;
                    
                    for (const frame of page.frames()) {
                        try {
                            const frameResult = await frame.evaluate(() => {
                                try {
                                    // 检查 localStorage 是否可用
                                    if (!window.localStorage) return null;
                                    
                                    // --- 方法 1: LocalStorage 模糊搜索 ---
                                    const keyCount = window.localStorage.length;
                                    if (keyCount === 0) return null;

                                    for (let i = 0; i < keyCount; i++) {
                                        const key = window.localStorage.key(i);
                                        if (!key) continue;
                                        const value = window.localStorage.getItem(key);
                                        if (!value) continue;

                                        // 1. 精确匹配
                                        if (key.includes("MultiAccountStore") || key.includes("user_id_cache")) {
                                            try {
                                                const parsed = JSON.parse(value);
                                                if (parsed._state?.users?.[0]) return parsed._state.users[0];
                                                if (parsed.users?.[0]) return parsed.users[0];
                                            } catch(e) {}
                                        }

                                        // 2. 模糊搜索 "username"
                                        if (value.includes("username")) {
                                            try {
                                                const match = value.match(/"username"\s*:\s*"([^"]+)"/);
                                                if (match && match[1]) {
                                                    return { username: match[1], discriminator: "0", id: "fuzzy-found" };
                                                }
                                            } catch(e) {}
                                        }
                                    }
                                    
                                    // 备选：直接查找 user_info
                                    const userInfo = window.localStorage.getItem("user_info");
                                    if (userInfo) return JSON.parse(userInfo);

                                    // --- 方法 2: DOM 查找 ---
                                    const userArea = document.querySelector('section[aria-label="User area"]') || 
                                                     document.querySelector('div[aria-label="User area"]') ||
                                                     document.querySelector('div[class*="panels_"]');
                                    if (userArea) {
                                        const nameTag = userArea.querySelector('div[class*="nameTag_"]');
                                        if (nameTag) {
                                            const usernameEl = nameTag.querySelector('div[class*="username_"]') || nameTag.querySelector('span');
                                            if (usernameEl && usernameEl.textContent) {
                                                return { username: usernameEl.textContent, discriminator: "0", id: "dom-found" };
                                            }
                                        }
                                    }
                                } catch (e) { return null; }
                                return null;
                            });

                            if (frameResult && frameResult.username) {
                                foundUserInfo = frameResult;
                                break; // 找到就退出 Frame 循环
                            }
                        } catch (e) {
                            // Frame 可能已销毁或无法访问，忽略
                        }
                    }

                    const lsUserInfo = foundUserInfo;

                    if (lsUserInfo && lsUserInfo.username) {
                        userInfo = { 
                            username: lsUserInfo.username, 
                            discriminator: lsUserInfo.discriminator || "0",
                            id: lsUserInfo.id || "unknown"
                        };
                        loginSuccess = true;
                        const source = lsUserInfo.id === "dom-found" ? "页面元素" : "LocalStorage";
                        sendEvent({ type: "log", message: `从 ${source} 获取到用户信息: ${userInfo.username}` });
                        break; // 成功，跳出循环
                    } else if (i % 5 === 0) {
                         sendEvent({ type: "log", message: `当前页面未找到用户信息，继续扫描...` });
                    }

                    // 降级策略：如果 URL 已经是 /channels/ 且等待了超过 20 次 (40秒)，则认为成功
                    // 或者：如果检测到 API 401 但 URL 正确，说明是受限账号，直接视为成功，不浪费时间
                    if (i > 20 || (isTokenInvalid && i > 5)) {
                            const reason = isTokenInvalid ? "账号受限(API 401)" : "LS读取失败";
                            sendEvent({ type: "log", message: `${reason}，但 URL 验证通过，视为登录成功` });
                            userInfo = { username: `未知用户 (${reason})`, discriminator: "0000" };
                            loginSuccess = true;
                            break;
                    }
                    
                } catch (evalError: any) {
                    // 页面可能正在刷新或未准备好
                }
            }
        }

        // --- 5. 最终结果判定 ---
        if (loginSuccess && userInfo) {
            sendEvent({ 
                status: "success", 
                message: `登录成功: ${userInfo.username}`,
                info: userInfo
            });
            
            // 如果设置了登录成功后关闭窗口
            if (closeAfterLogin) {
                sendEvent({ type: "log", message: "登录成功，正在关闭浏览器窗口..." });
                
                // 1. 优先尝试通过 Puppeteer 关闭页面
                if (browser) {
                    try { 
                        const pages = await browser.pages();
                        await Promise.all(pages.map(p => p.close().catch(() => {})));
                    } catch (e) {}
                    
                    try {
                        browser.disconnect(); // 断开 CDP 连接
                        browser = null;
                    } catch (e: any) {
                        // sendEvent({ type: "log", message: `Puppeteer 断开失败: ${e.message}` });
                    }
                }

                // 2. 调用 MoreLogin API 停止环境 (这是最可靠的关闭方式)
                try {
                    // 等待一小会儿确保连接已释放
                    await new Promise(r => setTimeout(r, 2000)); // 增加到 2秒
                    await moreLoginClient.stopProfile(profileId);
                    sendEvent({ type: "log", message: "浏览器窗口已关闭" });
                } catch (e: any) {
                    // 忽略 404 (可能已经关闭)
                    if (!e.message?.includes("404")) {
                        sendEvent({ type: "log", message: `API 关闭窗口失败: ${e.message}` });
                    } else {
                        sendEvent({ type: "log", message: "浏览器窗口已关闭" });
                    }
                }
            }
        } else {
            // 如果循环结束还没拿到用户信息，但 URL 是对的
            if (page.url().includes("/channels/")) {
                sendEvent({ 
                    status: "success", 
                    message: "登录成功 (URL验证通过，但无法获取详细信息)",
                    info: { username: "未知用户" }
                });
                
                if (closeAfterLogin) {
                    sendEvent({ type: "log", message: "登录成功，正在关闭浏览器窗口..." });
                    
                    // 1. 优先尝试通过 Puppeteer 关闭页面
                    if (browser) {
                        try { 
                            const pages = await browser.pages();
                            await Promise.all(pages.map(p => p.close().catch(() => {})));
                        } catch (e) {}
                        
                        try {
                            browser.disconnect(); // 断开 CDP 连接
                            browser = null;
                        } catch (e: any) {
                            // sendEvent({ type: "log", message: `Puppeteer 断开失败: ${e.message}` });
                        }
                    }

                    // 2. 调用 MoreLogin API 停止环境 (这是最可靠的关闭方式)
                    try {
                        // 等待一小会儿确保连接已释放
                        await new Promise(r => setTimeout(r, 2000)); // 增加到 2秒
                        await moreLoginClient.stopProfile(profileId);
                        sendEvent({ type: "log", message: "浏览器窗口已关闭" });
                    } catch (e: any) {
                        // 忽略 404 (可能已经关闭)
                        if (!e.message?.includes("404")) {
                            sendEvent({ type: "log", message: `API 关闭窗口失败: ${e.message}` });
                        } else {
                            sendEvent({ type: "log", message: "浏览器窗口已关闭" });
                        }
                    }
                }
            } else {
                throw new Error("登录超时或失败，未能进入应用页面");
            }
        }

      } catch (error: any) {
        console.error("Login error:", error);
        sendEvent({ status: "error", message: error.message });
      } finally {
        // 确保清理资源
        if (browser) {
            try { browser.disconnect(); } catch (e) {}
        }
        
        // 如果设置了自动关闭，且有 profileId 和 client，尝试确保关闭
        if (closeAfterLogin && profileId && moreLoginClient) {
            try {
                // 这里不需要 await，因为 stream 即将关闭，但为了确保请求发出，我们不 await 结果但捕获错误
                // 或者我们可以 await，因为这是在 stream controller close 之前
                await moreLoginClient.stopProfile(profileId);
            } catch (e) {
                // 忽略错误，可能是已经关闭了
            }
        }

        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}