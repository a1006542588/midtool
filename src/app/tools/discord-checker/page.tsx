"use client";

import { useState, useRef } from "react";
import { 
  UserSearch, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Copy, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Globe,
  Settings,
  Bot
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

interface TokenResult {
  token: string;
  status: "pending" | "checking" | "valid" | "invalid" | "locked" | "rate_limit" | "error";
  proxy?: string;
  info?: {
    username: string;
    email: string | null;
    phone: string | null;
    verified: boolean;
    mfa_enabled: boolean;
    id: string;
    avatar: string | null;
  };
  message?: string;
}

export default function DiscordChecker() {
  const [inputTokens, setInputTokens] = useState("");
  const [inputProxies, setInputProxies] = useState("");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [concurrency, setConcurrency] = useState(5);
  const [stats, setStats] = useState({
    total: 0,
    checked: 0,
    valid: 0,
    invalid: 0,
    locked: 0,
    error: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const parseInput = () => {
    const tokens = inputTokens.split("\n").map(t => t.trim()).filter(Boolean);
    const proxies = inputProxies.split("\n").map(p => p.trim()).filter(Boolean);
    
    if (tokens.length === 0) return;

    const initialResults: TokenResult[] = tokens.map(token => ({
      token,
      status: "pending"
    }));

    setResults(initialResults);
    setStats({
      total: tokens.length,
      checked: 0,
      valid: 0,
      invalid: 0,
      locked: 0,
      error: 0
    });

    return { tokens, proxies };
  };

  const checkToken = async (token: string, proxy: string | undefined) => {
    try {
      const res = await fetch("/api/discord/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, proxy }),
        signal: abortControllerRef.current?.signal
      });
      const data = await res.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      return { status: "error", message: error.message };
    }
  };

  const startCheck = async () => {
    if (isProcessing) return;
    
    const data = parseInput();
    if (!data) return;
    
    const { tokens, proxies } = data;
    setIsProcessing(true);
    abortControllerRef.current = new AbortController();

    const queue = [...tokens];
    let activeWorkers = 0;
    let currentIndex = 0;

    const processNext = async () => {
      if (currentIndex >= tokens.length || abortControllerRef.current?.signal.aborted) {
        return;
      }

      const index = currentIndex++;
      const token = tokens[index];
      const proxy = proxies.length > 0 ? proxies[index % proxies.length] : undefined;

      // Update status to checking
      setResults(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status: "checking", proxy };
        return next;
      });

      try {
        const result = await checkToken(token, proxy);
        
        setResults(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            status: result.status,
            info: result.data,
            message: result.message
          };
          return next;
        });

        setStats(prev => ({
          ...prev,
          checked: prev.checked + 1,
          [result.status === "valid" ? "valid" : 
           result.status === "invalid" ? "invalid" : 
           result.status === "locked" ? "locked" : "error"]: 
           (prev as any)[result.status === "valid" ? "valid" : 
           result.status === "invalid" ? "invalid" : 
           result.status === "locked" ? "locked" : "error"] + 1
        }));

      } catch (error: any) {
        if (error.name === 'AbortError') return;
        setResults(prev => {
          const next = [...prev];
          next[index] = { ...next[index], status: "error", message: "Check failed" };
          return next;
        });
      }

      if (!abortControllerRef.current?.signal.aborted) {
        await processNext();
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, tokens.length); i++) {
      workers.push(processNext());
    }

    await Promise.all(workers);
    setIsProcessing(false);
    abortControllerRef.current = null;
  };

  const stopCheck = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
    }
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const data = results.map(r => ({
      Token: r.token,
      Status: r.status,
      Username: r.info?.username || "",
      Email: r.info?.email || "",
      Phone: r.info?.phone || "",
      Verified: r.info?.verified ? "Yes" : "No",
      MFA: r.info?.mfa_enabled ? "Yes" : "No",
      Proxy: r.proxy || "",
      Message: r.message || ""
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Discord Tokens");
    XLSX.writeFile(wb, `discord_tokens_${new Date().getTime()}.xlsx`);
  };

  const copyValid = () => {
    const validTokens = results
      .filter(r => r.status === "valid")
      .map(r => r.token)
      .join("\n");
    navigator.clipboard.writeText(validTokens);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="Discord Token 检测"
        description="批量检测 Token 有效性，支持代理 IP 轮询，防止封号"
        icon={UserSearch}
        action={
          !isProcessing ? (
            <button
              onClick={startCheck}
              disabled={!inputTokens.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              开始检测
            </button>
          ) : (
            <button
              onClick={stopCheck}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              停止检测
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Token 列表</h2>
            <textarea
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
              placeholder="每行一个 Token..."
              className="w-full h-48 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
            />
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                代理设置 (可选)
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">并发数:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)}
                  className="w-12 px-1 py-0.5 text-xs border rounded bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
            <textarea
              value={inputProxies}
              onChange={(e) => setInputProxies(e.target.value)}
              placeholder="ip:port:user:pass 或 ip:port&#10;每行一个，自动轮询"
              className="w-full h-32 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
            />
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">实时统计</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-center">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">总数</div>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</div>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="text-xs text-blue-600 dark:text-blue-400">已检测</div>
                <div className="font-bold text-blue-700 dark:text-blue-300">{stats.checked}</div>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="text-xs text-green-600 dark:text-green-400">有效</div>
                <div className="font-bold text-green-700 dark:text-green-300">{stats.valid}</div>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <div className="text-xs text-red-600 dark:text-red-400">无效/被锁</div>
                <div className="font-bold text-red-700 dark:text-red-300">{stats.invalid + stats.locked}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">检测结果</h2>
              <div className="flex gap-2">
                <button
                  onClick={copyValid}
                  disabled={stats.valid === 0}
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title="复制有效 Token"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={exportResults}
                  disabled={results.length === 0}
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title="导出 Excel"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setResults([]);
                    setInputTokens("");
                    setStats({ total: 0, checked: 0, valid: 0, invalid: 0, locked: 0, error: 0 });
                  }}
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="清空"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden flex flex-col">
              <div className="grid grid-cols-12 gap-4 p-3 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                <div className="col-span-1 text-center">状态</div>
                <div className="col-span-3">用户</div>
                <div className="col-span-3">绑定信息</div>
                <div className="col-span-2">Token (末尾)</div>
                <div className="col-span-3">检测信息</div>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-2">
                {results.map((res, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-700 text-sm items-center hover:shadow-sm transition-shadow">
                    {/* 状态图标 */}
                    <div className="col-span-1 flex justify-center">
                      {res.status === "pending" && <div className="w-2 h-2 bg-neutral-300 dark:bg-neutral-600 rounded-full" />}
                      {res.status === "checking" && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                      {res.status === "valid" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {res.status === "invalid" && <XCircle className="w-5 h-5 text-red-500" />}
                      {res.status === "locked" && <ShieldAlert className="w-5 h-5 text-orange-500" />}
                      {res.status === "rate_limit" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      {res.status === "error" && <AlertTriangle className="w-5 h-5 text-neutral-400" />}
                    </div>

                    {/* 用户信息 (头像 + 用户名) */}
                    <div className="col-span-3 flex items-center gap-3 overflow-hidden">
                      {res.info?.avatar ? (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${res.info.id}/${res.info.avatar}.png`} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-400 flex-shrink-0">
                          <UserSearch className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate" title={res.info?.username}>
                          {res.info?.username || "-"}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          {res.info?.id || "-"}
                        </div>
                      </div>
                    </div>

                    {/* 绑定信息 (邮箱 + 手机) */}
                    <div className="col-span-3 space-y-1 overflow-hidden">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 truncate" title={res.info?.email || "未绑定邮箱"}>
                        <span className={res.info?.email ? "text-green-600 dark:text-green-400" : "text-neutral-300 dark:text-neutral-600"}>📧</span>
                        {res.info?.email || "未绑定"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 truncate" title={res.info?.phone || "未绑定手机"}>
                        <span className={res.info?.phone ? "text-green-600 dark:text-green-400" : "text-neutral-300 dark:text-neutral-600"}>📱</span>
                        {res.info?.phone || "未绑定"}
                      </div>
                    </div>

                    {/* Token (末尾) */}
                    <div className="col-span-2 font-mono text-xs text-neutral-400 truncate" title={res.token}>
                      ...{res.token.slice(-10)}
                    </div>

                    {/* 检测信息 (IP + 状态描述) */}
                    <div className="col-span-3 space-y-1 overflow-hidden">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 truncate" title={res.proxy || "直连"}>
                        <Globe className="w-3 h-3" />
                        {res.proxy ? res.proxy.split("@").pop() : "本地 IP"}
                      </div>
                      <div className={`text-xs truncate font-medium ${
                        res.status === "valid" ? "text-green-600 dark:text-green-400" : 
                        res.status === "invalid" ? "text-red-600 dark:text-red-400" : 
                        res.status === "locked" ? "text-orange-600 dark:text-orange-400" : "text-neutral-400"
                      }`}>
                        {res.message || (res.status === "valid" ? (res.info?.verified ? "已验证" : "未验证") : res.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 py-10">
                    <UserSearch className="w-12 h-12 mb-2 opacity-20" />
                    <p>等待输入...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
