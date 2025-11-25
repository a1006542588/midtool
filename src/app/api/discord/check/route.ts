import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

export async function POST(req: NextRequest) {
  try {
    const { token, proxy } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    let httpsAgent;

    if (proxy) {
      let proxyUrl = proxy.trim();
      
      // 处理不带协议的格式
      if (!proxyUrl.includes("://")) {
        const parts = proxyUrl.split(":");
        
        // 格式: IP:Port:User:Pass (常见于 socks5 代理购买后的格式)
        if (parts.length === 4) {
          const [ip, port, user, pass] = parts;
          // 默认使用 socks5，因为这种格式在 socks 代理中很常见
          proxyUrl = `socks5://${user}:${pass}@${ip}:${port}`;
        } 
        // 格式: IP:Port
        else if (parts.length === 2) {
          proxyUrl = `http://${proxyUrl}`;
        }
        // 其他情况尝试直接加 http
        else {
          proxyUrl = `http://${proxyUrl}`;
        }
      }

      try {
        if (proxyUrl.startsWith("socks")) {
          httpsAgent = new SocksProxyAgent(proxyUrl);
        } else {
          httpsAgent = new HttpsProxyAgent(proxyUrl);
        }
      } catch (e) {
        console.error("Proxy agent creation failed:", e);
        return NextResponse.json({ status: "error", message: "Invalid proxy format" });
      }
    }

    const response = await axios.get("https://discord.com/api/v9/users/@me", {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      httpsAgent: httpsAgent,
      validateStatus: () => true,
      timeout: 30000, // 增加到 30 秒超时
    });

    if (response.status === 200) {
      return NextResponse.json({
        status: "valid",
        data: {
          id: response.data.id,
          username: response.data.username,
          discriminator: response.data.discriminator,
          global_name: response.data.global_name,
          email: response.data.email,
          phone: response.data.phone,
          verified: response.data.verified,
          mfa_enabled: response.data.mfa_enabled,
          flags: response.data.flags,
          premium_type: response.data.premium_type,
          avatar: response.data.avatar,
        },
      });
    } else if (response.status === 401) {
      return NextResponse.json({ status: "invalid" });
    } else if (response.status === 403) {
      // 403 可能是被锁，也可能是需要验证
      return NextResponse.json({ status: "locked", message: response.data?.message });
    } else if (response.status === 429) {
      return NextResponse.json({ status: "rate_limit" });
    } else {
      return NextResponse.json({ 
        status: "error", 
        code: response.status,
        message: response.data?.message || "Unknown status" 
      });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      status: "error", 
      message: error.message || "Request failed" 
    });
  }
}
