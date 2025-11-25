"use client";

import { useState, useEffect } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { 
  Mail, 
  RefreshCw, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Inbox, 
  Loader2,
  ChevronRight,
  Search,
  LogOut,
  Link,
  Binary,
  Copy
} from "lucide-react";
import clsx from "clsx";

interface EmailAccount {
  id: string;
  email: string;
  password: string;
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  emails: EmailMessage[];
  lastChecked?: number;
}

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  text: string;
  html: string;
}

export default function FirstmailReceiver() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  // Remove extractMode state as we are moving to direct actions
  
  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("firstmail_accounts");
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load accounts", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("firstmail_accounts", JSON.stringify(accounts));
  }, [accounts]);

  // Reset selected email when account changes
  useEffect(() => {
    setSelectedEmailId(null);
  }, [selectedAccountId]);

  // Helper for generating IDs (crypto.randomUUID might not be available in non-secure contexts)
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleImport = () => {
    const lines = importText.split("\n").filter(l => l.trim());
    const newAccounts: EmailAccount[] = lines.map(line => {
      const [email, password] = line.split(/[:\s]+/).map(s => s.trim());
      if (!email || !password) return null;
      return {
        id: generateId(),
        email,
        password,
        status: "idle",
        emails: []
      };
    }).filter(Boolean) as EmailAccount[];

    setAccounts(prev => [...prev, ...newAccounts]);
    setImportText("");
    setShowImport(false);
  };

  const checkAccount = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: "loading", message: "正在连接..." } : a));

    try {
      const res = await fetch("/api/email/firstmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, password: account.password })
      });
      
      const data = await res.json();

      if (data.success) {
        setAccounts(prev => prev.map(a => a.id === id ? { 
          ...a, 
          status: "success", 
          emails: data.emails,
          lastChecked: Date.now(),
          message: `成功获取 ${data.emails.length} 封邮件`
        } : a));
      } else {
        setAccounts(prev => prev.map(a => a.id === id ? { 
          ...a, 
          status: "error", 
          message: data.error 
        } : a));
      }
    } catch (error: any) {
      setAccounts(prev => prev.map(a => a.id === id ? { 
        ...a, 
        status: "error", 
        message: "网络请求失败" 
      } : a));
    }
  };

  const checkAll = async () => {
    if (isCheckingAll) return;
    setIsCheckingAll(true);
    
    // Process in chunks of 3 to avoid overwhelming the server/network
    const chunkSize = 3;
    for (let i = 0; i < accounts.length; i += chunkSize) {
      const chunk = accounts.slice(i, i + chunkSize);
      await Promise.all(chunk.map(a => checkAccount(a.id)));
    }
    
    setIsCheckingAll(false);
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (selectedAccountId === id) setSelectedAccountId(null);
  };

  const clearAll = () => {
    if (confirm("确定要清空所有账号吗？")) {
      setAccounts([]);
      setSelectedAccountId(null);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const selectedEmail = selectedAccount?.emails.find(e => e.id === selectedEmailId);

  // Smart extraction logic
  const extractSmart = (text: string, html: string) => {
    const content = (text || "") + " " + (html || "");
    
    // 1. Extract Code
    // Strategy: Look for keywords like "code is", "verification code", "pin" nearby digits
    // Or fallback to finding standalone 4-8 digit numbers
    
    const codeKeywords = /code|pin|verification|verify|otp|confirm|验证码|代码|动态码|确认码/i;
    const badKeywords = /box|street|suite|floor|road|ave|avenue|tel|phone|fax|zip|postal|year|anniversary|size|width|height|px|color|background|margin|padding/i;
    
    // Find all 4-8 digit numbers with context
    // Capture 30 chars before and after to check for keywords
    const digitRegexWithContext = /(.{0,30})(\b\d{4,8}\b)(.{0,30})/g;
    
    let match;
    const candidates = [];
    
    while ((match = digitRegexWithContext.exec(content)) !== null) {
        const pre = match[1] || "";
        const code = match[2];
        const post = match[3] || "";
        const context = pre + " " + post;
        
        // Exclude common years (1990-2030)
        if (/^(19|20)\d{2}$/.test(code)) continue;
        
        let score = 0;
        
        // Context scoring
        if (codeKeywords.test(context)) score += 10;
        if (badKeywords.test(context)) score -= 20; // Strong penalty for address/css/phone context
        
        // Length scoring
        if (code.length === 6) score += 5; // Prefer 6 digits
        else if (code.length === 4 || code.length === 8) score += 2; // Then 4 or 8 digits
        else score += 0; // 5 or 7 digits require keywords to pass
        
        candidates.push({ code, score });
    }
    
    // Sort by score and apply threshold
    // Must have positive score to be considered
    const bestCandidate = candidates.sort((a, b) => b.score - a.score)[0];
    const bestCode = (bestCandidate && bestCandidate.score > 0) ? bestCandidate.code : null;

    // 2. Extract Link
    // Use DOMParser if available (browser env)
    let bestLink = null;
    if (typeof window !== 'undefined') {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html || text, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'));
            
            let maxScore = -1;
            
            links.forEach(a => {
                const href = a.href;
                const text = a.textContent || "";
                let score = 0;
                
                if (!href || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
                
                // Keywords
                const verifyKw = /verify|confirm|activate|login|secure|auth|验证|确认|激活|登录/i;
                const badKw = /unsubscribe|privacy|terms|help|support|退订|隐私|条款|contact/i;
                
                if (badKw.test(text) || badKw.test(href)) score -= 100;
                if (verifyKw.test(text)) score += 10;
                if (verifyKw.test(href)) score += 5;
                
                // Button style often indicates the main action
                if (a.className.includes('btn') || a.className.includes('button') || (a.getAttribute('style') || "").includes('background')) score += 3;
                
                if (score > maxScore && score > 0) {
                    maxScore = score;
                    bestLink = href;
                }
            });
        } catch (e) {
            console.error("DOMParser failed", e);
        }
    }
    
    // Fallback regex if DOMParser fails or no HTML link found
    if (!bestLink) {
        const rawUrlRegex = /https?:\/\/[^\s"'>]+/g;
        const rawLinks = content.match(rawUrlRegex) || [];
        const verifyKw = /verify|confirm|activate|login|secure|auth|验证|确认|激活|登录/i;
        const badKw = /unsubscribe|privacy|terms|help|support|退订|隐私|条款|contact/i;
        
        bestLink = rawLinks.find(l => verifyKw.test(l) && !badKw.test(l)) || null;
    }

    return { code: bestCode, link: bestLink };
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 h-[calc(100vh-4rem)] flex flex-col">
      <ToolHeader
        title="Firstmail 邮箱收信"
        description="批量管理 Firstmail.ltd 邮箱，一键收取所有邮件。支持智能提取验证码与链接。"
        icon={Mail}
      />

      <div className="flex-1 flex gap-6 min-h-0 mt-6">
        {/* Left Sidebar: Account List */}
        <div className="w-72 flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">账号列表 ({accounts.length})</h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowImport(!showImport)}
                  className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm rounded-md transition-all"
                  title="添加账号"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={clearAll}
                  className="p-1.5 text-red-600 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm rounded-md transition-all"
                  title="清空列表"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <button
              onClick={checkAll}
              disabled={isCheckingAll || accounts.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isCheckingAll ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {isCheckingAll ? "正在收取..." : "收取所有邮件"}
            </button>
          </div>

          {showImport && (
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 animate-in slide-in-from-top-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="email:password&#10;每行一个"
                className="w-full h-32 p-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-md mb-2 focus:ring-1 focus:ring-brand focus:border-brand"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex-1 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs rounded hover:bg-neutral-800 dark:hover:bg-neutral-100"
                >
                  导入
                </button>
                <button
                  onClick={() => setShowImport(false)}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-400 text-sm">
                <Inbox size={32} className="mb-2 opacity-20" />
                <p>暂无账号</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {accounts.map(account => (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={clsx(
                      "p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group relative",
                      selectedAccountId === account.id ? "bg-brand/5 hover:bg-brand/10" : ""
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate pr-2">
                        {account.email}
                      </div>
                      {account.status === "loading" && <Loader2 size={14} className="animate-spin text-brand shrink-0" />}
                      {account.status === "success" && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full shrink-0">{account.emails.length}</span>}
                      {account.status === "error" && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">
                        {account.message || "等待操作"}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAccount(account.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Email List & Detail */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
          {selectedAccount ? (
            <>
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-neutral-900 dark:text-neutral-100">{selectedAccount.email}</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {selectedAccount.lastChecked 
                        ? `上次更新: ${new Date(selectedAccount.lastChecked).toLocaleTimeString()}`
                        : "从未更新"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => checkAccount(selectedAccount.id)}
                    disabled={selectedAccount.status === "loading"}
                    className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <RefreshCw size={14} className={selectedAccount.status === "loading" ? "animate-spin" : ""} />
                    刷新
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0 bg-neutral-50/30 dark:bg-neutral-900/50 flex">
                {/* Email List Column */}
                <div className={`${selectedEmailId ? 'w-80 border-r border-neutral-200 dark:border-neutral-800 hidden lg:block' : 'w-full'} h-full overflow-y-auto bg-white dark:bg-neutral-900`}>
                  {selectedAccount.emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-6">
                      {selectedAccount.status === "error" ? (
                        <>
                          <AlertCircle size={48} className="mb-4 text-red-200 dark:text-red-900/50" />
                          <p className="text-red-500 font-medium mb-1">获取失败</p>
                          <p className="text-sm text-center">{selectedAccount.message}</p>
                        </>
                      ) : (
                        <>
                          <Inbox size={48} className="mb-4 opacity-20" />
                          <p>暂无邮件</p>
                          <button 
                            onClick={() => checkAccount(selectedAccount.id)}
                            className="mt-4 text-brand hover:underline text-sm"
                          >
                            点击收取邮件
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {selectedAccount.emails.map((email) => {
                        const { code, link } = extractSmart(email.text, email.html);
                        return (
                          <div 
                            key={email.id} 
                            className={clsx(
                              "flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group",
                              selectedEmailId === email.id ? "bg-brand/5 border-l-4 border-l-brand pl-2" : "border-l-4 border-l-transparent pl-2"
                            )}
                          >
                            {/* Left: Title & Time */}
                            <div 
                              className="flex-1 min-w-0 mr-4 cursor-pointer"
                              onClick={() => setSelectedEmailId(email.id)}
                            >
                              <div className={clsx("font-medium text-sm truncate mb-1", selectedEmailId === email.id ? "text-brand" : "text-neutral-900 dark:text-neutral-100")}>
                                {email.subject || "(无主题)"}
                              </div>
                              <div className="text-xs text-neutral-400">
                                {new Date(email.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); if(code) copyToClipboard(code); }}
                                disabled={!code}
                                className={clsx(
                                  "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all border",
                                  code 
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 shadow-sm" 
                                    : "bg-neutral-50 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 border-neutral-100 dark:border-neutral-700 cursor-not-allowed"
                                )}
                                title={code ? `复制验证码: ${code}` : "未检测到验证码"}
                              >
                                <Binary size={14} />
                                <span>验证码</span>
                              </button>
                              
                              <button
                                onClick={(e) => { e.stopPropagation(); if(link) copyToClipboard(link); }}
                                disabled={!link}
                                className={clsx(
                                  "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all border",
                                  link 
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-300 shadow-sm" 
                                    : "bg-neutral-50 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 border-neutral-100 dark:border-neutral-700 cursor-not-allowed"
                                )}
                                title={link ? "复制验证链接" : "未检测到验证链接"}
                              >
                                <Link size={14} />
                                <span>链接</span>
                              </button>

                              <button
                                onClick={() => setSelectedEmailId(email.id)}
                                className={clsx(
                                  "p-1.5 rounded-md transition-all border",
                                  selectedEmailId === email.id 
                                    ? "bg-brand/10 text-brand border-brand/20" 
                                    : "bg-white dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-600 dark:hover:text-neutral-300"
                                )}
                                title="查看详情"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Email Detail Column */}
                {selectedEmail ? (
                  <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-neutral-900 flex flex-col">
                    {/* Detail Header */}
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 leading-snug">
                        {selectedEmail.subject || "(无主题)"}
                      </h2>
                      <div className="flex items-center justify-between text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400 w-12">发件人:</span>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">{selectedEmail.from}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400 w-12">收件人:</span>
                            <span className="text-neutral-700 dark:text-neutral-300">{selectedEmail.to}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400 w-12">时间:</span>
                            <span className="text-neutral-700 dark:text-neutral-300">{new Date(selectedEmail.date).toLocaleString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedEmailId(null)}
                          className="lg:hidden px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-md"
                        >
                          返回列表
                        </button>
                      </div>
                    </div>

                    {/* Extraction Toolbar - REMOVED as per user request */}
                    
                    {/* Email Content */}
                    <div className="flex-1 p-6 overflow-auto">
                      {selectedEmail.html ? (
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.html }} 
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {selectedEmail.text}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-neutral-400 bg-neutral-50/30 dark:bg-neutral-900/50">
                    <Mail size={48} className="mb-4 opacity-10" />
                    <p>选择一封邮件查看详情</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <Mail size={64} className="mb-4 opacity-10" />
              <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">选择左侧账号查看邮件</p>
              <p className="text-sm mt-2">或点击“添加账号”开始使用</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
