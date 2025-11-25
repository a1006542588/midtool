# Web3 & Data Toolbox (Web3 与数据全能工具箱)

基于 Next.js 构建的多功能自动化与数据处理平台，聚合了账号运营、数据清洗、Web3 工具等 17 款高效率脚本，支持源码运行与独立打包分发。

---

## 📚 目录
- [项目简介](#项目简介)
- [快速上手](#快速上手)
- [核心主打工具 · Discord 自动登录](#核心主打工具--discord-自动登录)
- [工具一览](#工具一览)
- [注意事项](#注意事项)
- [贡献与反馈](#贡献与反馈)

---

## 项目简介
- **技术栈**：Next.js / TypeScript / Tailwind CSS
- **运行模式**：支持开发调试、生产部署、独立打包 (含 `start.bat`)
- **目标人群**：多账号运营团队、数据分析员、Web3 从业者

---

## 快速上手
### ✅ 独立运行包（推荐给测试同事）
1. 获取 public/downloads/discord-login-tool.zip 并解压。
2. 双击运行 start.bat，等待浏览器自动打开本地服务。
3. 若 MoreLogin 未启动，请先打开 MoreLogin 客户端并开启本地 API（默认端口 40000）。

### 🧑‍💻 开发者模式
```
npm install
npm run dev
```
访问 [http://localhost:3000](http://localhost:3000) 进行调试。

### 🚀 生产部署
```
npm install
npm run build
npm start
```
建议使用 PM2 守护进程：
```
pm2 start npm --name "toolbox" -- start
```

---

## 核心主打工具 · Discord 自动登录
面向 MoreLogin 指纹浏览器用户，实现 Discord 账号的批量免密登录。

### 亮点特性
- **多线程并发**：稳定支持 3-5 线程同时启动浏览器实例。
- **无头/有头模式**：既可后台静默运行，也支持可视化排错。
- **WebSocket Token 注入**：直接注入 Token，避免模拟键盘输入带来的风控风险。
- **状态识别**：自动区分正常、风控、二次验证、已封禁等状态并记录日志。
- **一键分发**：配套 start.bat 与独立打包方案，轻松分享给同事。

### 使用流程
1. **准备环境**：启动 MoreLogin → 设置 → 打开“本地 API”，记录端口（默认 40000）。
2. **填写凭据**：在工具设置页输入 `App ID` / `Secret Key`（MoreLogin → 设置 → 本地 API）。
3. **导入数据**：支持 `ProfileID` 列表（仅启动环境）或 `ProfileID----Token` 列表（启动并自动登录）。
4. **启动任务**：设置线程数后点击“开始执行”，查看状态面板输出。

### 运行前提
- Windows 系统 + MoreLogin 指纹浏览器（已登录且本地 API 可用）。
- 若使用代理，请确保代理允许 MoreLogin 正常访问。

---

## 工具一览
按 `src/config/tools.ts` 中的分类顺序列出全部工具。

### 📧 邮箱与推荐
| 工具 | 功能亮点 | 入口 |
| --- | --- | --- |
| Firstmail 邮箱收信 | 批量收取 Firstmail.ltd 邮件，验证码集中管理 | `/tools/firstmail-receiver` |
| MoreLogin 指纹浏览器 | 官方推荐指纹浏览器介绍页 | `/tools/morelogin` |

### 📊 数据处理
| 工具 | 功能亮点 | 入口 |
| --- | --- | --- |
| 列表去重清洗 | 去重、去空行、打乱顺序、裁剪空格 | `/tools/list-cleaner` |
| 格式转换工具 | 自定义分隔符/模板，灵活转换账号格式 | `/tools/format-converter` |
| 文本提取工具 | 正则提取邮箱/URL/IP/私钥等结构化数据 | `/tools/text-extractor` |
| Cookie 格式转换 | JSON ↔ Netscape Cookie 相互转换 | `/tools/cookie-converter` |
| 列表交集差集 | 计算两个列表的交集、并集、差集 | `/tools/list-diff` |
| 批量编码加密 | Base64/URL/Hex 编解码 & MD5/SHA 哈希 | `/tools/batch-encoder` |
| 邮箱处理工具 | 邮箱过滤、去重、别名生成，支持导出 | `/tools/email-processor` |

### 🔍 账号查询
| 工具 | 功能亮点 | 入口 |
| --- | --- | --- |
| Discord Token 检测 | 批量校验 Token 有效性，支持代理轮询 | `/tools/discord-checker` |
| Discord 自动登录 | 批量自动登录 Discord（核心工具） | `/tools/discord-login` |
| 推特账号查询 | 批量检测 Twitter 状态并拉取资料 | `/tools/twitter-checker` |

### 🛠️ 便捷工具
| 工具 | 功能亮点 | 入口 |
| --- | --- | --- |
| IP 纯净度检测 | 批量检测代理质量、归属地、网络类型 | `/tools/proxy-checker` |
| 2FA 动态码生成 | 多账号 TOTP 实时计算，一键复制 | `/tools/2fa-generator` |
| 强密码生成器 | 自定义字符集批量生成高强度密码 | `/tools/password-generator` |
| User-Agent 生成 | 按系统/浏览器批量生成 UA 指纹 | `/tools/ua-generator` |

### 🌐 Web3 工具
| 工具 | 功能亮点 | 入口 |
| --- | --- | --- |
| Web3 批量钱包生成 | 离线生成 EVM 链地址/私钥/助记词 | `/tools/wallet-generator` |
| Web3 批量转账/归集 | 支持多链的批量代币发送与归集 | `/tools/batch-transfer` |

---

## 注意事项
- **API 安全**：MoreLogin `App ID` 与 `Secret Key` 仅用于本地调用，请妥善保管。
- **并发建议**：根据设备性能与 MoreLogin 限制，建议同时运行 3-5 线程。
- **大文件提醒**：仓库包含 data/IP2LOCATION.BIN（约 95MB），如需精简可在打包前删除或改用 Git LFS。

---

## 🤝 贡献与反馈

如果您在使用过程中发现 Bug 或有新功能建议，请提交 Issue 或 Pull Request。
