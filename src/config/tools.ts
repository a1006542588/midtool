import { LucideIcon, Split, FileText, Wallet, ArrowRightLeft, UserSearch, ShieldCheck, Globe, Filter, RefreshCw, Key, Monitor, Cookie, GitCompare, Binary, Mail, Bot, Fingerprint } from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: "data-processing" | "convenient" | "account-query" | "web3" | "recommendation" | "email-tools";
  subcategory?: string;
  isAutomation?: boolean;
}

export const tools: Tool[] = [
  {
    id: "firstmail-receiver",
    name: "Firstmail 邮箱收信",
    description: "批量管理 Firstmail.ltd 邮箱，一键收取所有邮件。数据本地存储，安全高效。",
    icon: Mail,
    href: "/tools/firstmail-receiver",
    category: "email-tools",
  },
  {
    id: "morelogin",
    name: "MoreLogin 指纹浏览器",
    description: "专业的指纹浏览器，多账号防关联管理神器。提供真实指纹环境，安全高效。",
    icon: Fingerprint,
    href: "/tools/morelogin",
    category: "recommendation",
    subcategory: "指纹浏览器",
  },
  {
    id: "list-cleaner",
    name: "列表去重清洗",
    description: "高效处理文本列表。支持一键去重、去除空行、打乱顺序、去除首尾空格，是处理账号库的必备神器。",
    icon: Filter,
    href: "/tools/list-cleaner",
    category: "data-processing",
  },
  {
    id: "format-converter",
    name: "格式转换工具",
    description: "灵活转换账号/代理格式。支持自定义分隔符与输出模板，轻松将 user:pass 转换为 JSON 或其他格式。",
    icon: RefreshCw,
    href: "/tools/format-converter",
    category: "data-processing",
  },
  {
    id: "text-extractor",
    name: "文本提取工具",
    description: "智能文本清洗与提取。支持自定义分隔符、列选择、正则提取，轻松处理日志、Cookie 及各类结构化文本。",
    icon: Split,
    href: "/tools/text-extractor",
    category: "data-processing",
  },
  {
    id: "cookie-converter",
    name: "Cookie 格式转换",
    description: "Netscape 与 JSON 格式 Cookie 互转，支持批量处理与格式化。",
    icon: Cookie,
    href: "/tools/cookie-converter",
    category: "data-processing",
  },
  {
    id: "list-diff",
    name: "列表交集差集",
    description: "比较两个文本列表，快速计算交集、并集、差集，支持去重。",
    icon: GitCompare,
    href: "/tools/list-diff",
    category: "data-processing",
  },
  {
    id: "batch-encoder",
    name: "批量编码加密",
    description: "支持 Base64、URL、Hex 编码转换，以及 MD5、SHA 等哈希计算。",
    icon: Binary,
    href: "/tools/batch-encoder",
    category: "data-processing",
  },
  {
    id: "email-processor",
    name: "邮箱处理工具",
    description: "批量提取、过滤、去重和生成邮箱别名，支持 Excel 导出。",
    icon: Mail,
    href: "/tools/email-processor",
    category: "data-processing",
  },
  {
    id: "discord-checker",
    name: "Discord Token 检测",
    description: "批量检测 Token 有效性，支持代理 IP 轮询，防止封号。",
    icon: Bot,
    href: "/tools/discord-checker",
    category: "account-query",
  },
  {
    id: "discord-login",
    name: "Discord 自动登录",
    description: "使用 MoreLogin 指纹浏览器自动登录 Discord，支持 2FA 和 hCaptcha 自动打码。",
    icon: Bot,
    href: "/tools/discord-login",
    category: "account-query",
    isAutomation: true,
  },
  {
    id: "proxy-checker",
    name: "IP 纯净度检测",
    description: "批量检测代理 IP 质量。支持延迟测试、归属地查询及 IP 类型识别(机房/住宅)。",
    icon: Globe,
    href: "/tools/proxy-checker",
    category: "convenient",
  },
  {
    id: "2fa-generator",
    name: "2FA 动态码生成",
    description: "批量导入 2FA 密钥，实时生成动态验证码。支持备注区分，点击一键复制。",
    icon: ShieldCheck,
    href: "/tools/2fa-generator",
    category: "convenient",
  },
  {
    id: "password-generator",
    name: "强密码生成器",
    description: "生成高强度随机密码。支持自定义长度、字符集（大小写/数字/符号）及批量生成导出。",
    icon: Key,
    href: "/tools/password-generator",
    category: "convenient",
  },
  {
    id: "ua-generator",
    name: "User-Agent 生成",
    description: "批量生成随机 User-Agent。支持筛选操作系统与浏览器类型，模拟真实访问环境。",
    icon: Monitor,
    href: "/tools/ua-generator",
    category: "convenient",
  },
  {
    id: "twitter-checker",
    name: "推特账号查询",
    description: "查询推特账号信息，支持批量检测账号状态及获取详细资料。",
    icon: UserSearch,
    href: "/tools/twitter-checker",
    category: "account-query",
  },
  {
    id: "wallet-generator",
    name: "Web3 批量钱包生成",
    description: "批量生成多链钱包地址、私钥及助记词。支持导出 Excel，完全本地离线运行，安全无忧。",
    icon: Wallet,
    href: "/tools/wallet-generator",
    category: "web3",
  },
  {
    id: "batch-transfer",
    name: "Web3 批量转账/归集",
    description: "支持多链代币批量发送与归集。连接钱包授权发送，或导入私钥批量归集。本地运行，安全可靠。",
    icon: ArrowRightLeft,
    href: "/tools/batch-transfer",
    category: "web3",
  },
];

export const categories = {
  "data-processing": "数据处理",
  "email-tools": "邮箱工具",
  "convenient": "便捷工具",
  "account-query": "账号查询",
  "web3": "Web3 工具",
  "recommendation": "跨海工具推荐",
};
