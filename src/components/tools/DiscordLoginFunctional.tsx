"use client";

import { useState, useRef } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { Bot, Play, Loader2, CheckCircle2, XCircle, Settings, Pause, Square, PlayCircle, Download, Upload } from "lucide-react";
import clsx from "clsx";
import * as XLSX from 'xlsx';

interface LoginResult {
  email: string;
  status: "pending" | "processing" | "success" | "error" | "action_required";
  token?: string;
  message?: string;
  info?: any;
}

export function DiscordLoginFunctional() {
  const [inputData, setInputData] = useState("");
  const [moreLoginApiUrl, setMoreLoginApiUrl] = useState("http://127.0.0.1:40000");
  const [moreLoginAppId, setMoreLoginAppId] = useState("");
  const [moreLoginSecretKey, setMoreLoginSecretKey] = useState("");
  // const [noCaptchaApiKey, setNoCaptchaApiKey] = useState("");
  // const [noCaptchaApiUrl, setNoCaptchaApiUrl] = useState("http://api.nocaptcha.io/api/wanda/hcaptcha/universal");
  const [autoMatchProfile, setAutoMatchProfile] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"password" | "token">("token"); // Default to token
  const [concurrency, setConcurrency] = useState(1);
  const [closeAfterLogin, setCloseAfterLogin] = useState(true);

  const [results, setResults] = useState<LoginResult[]>([]);
  const [globalLogs, setGlobalLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false); // Use ref for immediate access in loop
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll logs
  const addLog = (msg: string) => {
      setGlobalLogs(prev => {
          const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
          if (newLogs.length > 1000) return newLogs.slice(newLogs.length - 1000);
          return newLogs;
      });
      // Scroll to bottom
      setTimeout(() => {
          if (logsEndRef.current) {
              logsEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
      }, 100);
  };

  const togglePause = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    isPausedRef.current = newState;
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setCurrentProcessingIndex(null);
    setIsPaused(false);
    isPausedRef.current = false;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processContent = (content: string) => {
        setInputData(content);
        const lines = content.trim().split("\n").filter(l => l.trim());
        const initialResults: LoginResult[] = lines.map(line => {
          // 格式: 窗口名称, 窗口ID, Token
          const parts = line.split(/[,|:]/).map(p => p.trim()); // 支持逗号、竖线或冒号分隔
          
          let profileName = "";
          let profileId = "";
          let token = "";

          if (parts.length >= 3) {
              profileName = parts[0];
              profileId = parts[1];
              token = parts[2];
          } else if (parts.length === 2) {
              // 兼容旧格式: Token, ProfileID (尝试猜测)
              if (parts[0].length > 50) { // 第一列像 Token
                  token = parts[0];
                  profileId = parts[1];
              } else {
                  profileId = parts[0];
                  token = parts[1];
              }
          } else {
              token = parts[0];
          }

          return {
            email: token, // 显示 Token
            status: "pending",
            info: { profileName, profileId } // 存储解析出的信息
          };
        });
        setResults(initialResults);
        addLog(`已导入 ${lines.length} 个账号`);
    };

    const reader = new FileReader();
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = (event) => {
            const data = event.target?.result;
            if (!data) return;
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            // Convert to CSV-like string for consistency
            const csvLines = jsonData
                .filter(row => row.length > 0)
                .map(row => row.join(','));
            
            processContent(csvLines.join('\n'));
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) processContent(text);
        };
        reader.readAsText(file);
    }
    
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    // 导出格式: 窗口名, 窗口ID, TOKEN, 用户名, 状态, 失败原因
    const headers = ["窗口名", "窗口ID", "TOKEN", "用户名", "状态", "失败原因"];
    const csvContent = [
      headers.join(","),
      ...results.map(r => {
        const info = r.info || {};
        // 如果 info 里没有 profileName/Id (比如直接粘贴 Token 运行)，尝试从 inputData 重新解析可能不准确，
        // 但我们在 handleStart 已经尽力解析并存入 info 了。
        
        // 状态映射
        let statusText: string = r.status;
        if (r.status === "success") statusText = "成功";
        else if (r.status === "error") statusText = "失败";
        else if (r.status === "action_required") statusText = "需人工干预";
        else if (r.status === "pending") statusText = "等待中";
        else if (r.status === "processing") statusText = "进行中";

        return [
          `"${info.profileName || ""}"`,
          `"${info.profileId || ""}"`,
          `"${r.token || r.email || ""}"`, // 优先用返回的 Token，没有则用输入的 (存放在 email 字段)
          `"${info.username || ""}"`,
          `"${statusText}"`,
          `"${r.message || ""}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `discord_login_results_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processItem = async (line: string, index: number, signal: AbortSignal) => {
      // 格式: 窗口名称, 窗口ID, Token
      const parts = line.split(/[,|:]/).map(p => p.trim());
      
      let payload: any = {
        moreLoginApiUrl,
        moreLoginAppId,
        moreLoginSecretKey,
        autoMatchProfile,
        loginMethod,
        closeAfterLogin
      };

      if (loginMethod === "password") {
         // ... existing password logic (if needed later) ...
         // For now, assume token login based on new format requirement
      } else {
        // Token login with new format: Name, ID, Token
        if (parts.length >= 3) {
             payload.moreLoginProfileId = parts[1]; // 第二列是 ID
             payload.token = parts[2];            // 第三列是 Token
             payload.profileSearchTerm = parts[0]; // 第一列是名称 (备用)
        } 
        else if (parts.length === 2) {
             // 兼容旧格式
             if (parts[0].length > 50) {
                 payload.token = parts[0];
                 payload.moreLoginProfileId = parts[1];
             } else {
                 payload.moreLoginProfileId = parts[0];
                 payload.token = parts[1];
             }
        }
        else {
             payload.token = parts[0];
        }
      }

      setResults(prev => {
        const newResults = [...prev];
        // 保留 info
        newResults[index] = { 
            ...newResults[index], 
            status: "processing", 
            message: "正在启动...",
            info: newResults[index].info 
        };
        return newResults;
      });
      addLog(`[${index + 1}] 开始处理: ${payload.moreLoginProfileId || "Unknown ID"}`);

      try {
        const response = await fetch("/api/discord/login-headless", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(l => l.trim());
            
            for (const jsonLine of lines) {
                try {
                    const data = JSON.parse(jsonLine);
                    
                    if (data.type === "log") {
                        addLog(`[${index + 1}] ${data.message}`);
                        setResults(prev => {
                            const newResults = [...prev];
                            // 如果已经是成功或失败状态，不要覆盖消息 (比如 "浏览器窗口已关闭" 这种日志)
                            if (newResults[index].status !== "success" && newResults[index].status !== "error") {
                                newResults[index] = { ...newResults[index], message: data.message };
                            }
                            return newResults;
                        });
                    } else if (data.status === "success") {
                        addLog(`[${index + 1}] 成功: ${data.message}`);
                        setResults(prev => {
                            const newResults = [...prev];
                            const existingInfo = newResults[index].info || {};
                            newResults[index] = { 
                                ...newResults[index], 
                                status: "success", 
                                token: data.token,
                                message: data.message,
                                info: { ...existingInfo, ...data.info } // 合并 info，保留 profileName/Id
                            };
                            return newResults;
                        });
                    } else if (data.status === "error") {
                        addLog(`[${index + 1}] 错误: ${data.message}`);
                        setResults(prev => {
                            const newResults = [...prev];
                            newResults[index] = { 
                                ...newResults[index], 
                                status: "error", 
                                message: data.message 
                            };
                            return newResults;
                        });
                    } else if (data.status === "action_required") {
                         addLog(`[${index + 1}] 需人工干预: ${data.reason}`);
                         setResults(prev => {
                            const newResults = [...prev];
                            newResults[index] = { 
                                ...newResults[index], 
                                status: "action_required", 
                                message: `需人工干预: ${data.reason}` 
                            };
                            return newResults;
                        });
                    }
                } catch (e) {
                }
            }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
            addLog(`[${index + 1}] 任务已停止`);
            setResults(prev => {
                const newResults = [...prev];
                newResults[index] = { ...newResults[index], status: "error", message: "已停止" };
                return newResults;
            });
        } else {
            addLog(`[${index + 1}] 异常: ${error.message}`);
            setResults(prev => {
              const newResults = [...prev];
              newResults[index] = { 
                ...newResults[index], 
                status: "error", 
                message: error.message 
              };
              return newResults;
            });
        }
      }
  };

  const handleStart = async () => {
    if (!inputData.trim()) {
      alert("请输入要处理的数据");
      return;
    }

    if (!moreLoginAppId.trim() || !moreLoginSecretKey.trim()) {
      alert("请填写 MoreLogin App ID 和 Secret Key");
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const lines = inputData.trim().split("\n").filter(l => l.trim());
    const initialResults: LoginResult[] = lines.map(line => {
      // 格式: 窗口名称, 窗口ID, Token
      const parts = line.split(/[,|:]/).map(p => p.trim());
      
      let profileName = "";
      let profileId = "";
      let token = "";

      if (parts.length >= 3) {
          profileName = parts[0];
          profileId = parts[1];
          token = parts[2];
      } else if (parts.length === 2) {
          if (parts[0].length > 50) {
              token = parts[0];
              profileId = parts[1];
          } else {
              profileId = parts[0];
              token = parts[1];
          }
      } else {
          token = parts[0];
      }

      return {
        email: token, // 兼容旧逻辑，主要用于显示
        status: "pending",
        info: { profileName, profileId } // 预存解析出的信息
      };
    });

    setResults(initialResults);
    setIsProcessing(true);
    setIsPaused(false);
    isPausedRef.current = false;

    // Concurrency Control
    const queue = lines.map((line, index) => ({ line, index }));
    
    // Worker function
    const worker = async () => {
        while (queue.length > 0 && !signal.aborted) {
             // Check pause
            while (isPausedRef.current) {
                if (signal.aborted) return;
                await new Promise(r => setTimeout(r, 500));
            }
            
            const item = queue.shift();
            if (!item) break;
            
            setCurrentProcessingIndex(item.index); // Just to show something is happening
            await processItem(item.line, item.index, signal);
        }
    };

    // Start workers
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push(worker());
        // 错峰启动，避免瞬间并发过高导致 CPU 或 API 拥堵
        if (i < concurrency - 1) {
            await new Promise(r => setTimeout(r, 3000)); 
        }
    }

    await Promise.all(workers);

    setIsProcessing(false);
    setCurrentProcessingIndex(null);
    setIsPaused(false);
    isPausedRef.current = false;
  };

  return (
    <div className="w-full px-4 space-y-6">
      <ToolHeader
        title="Discord 自动登录"
        description="使用 MoreLogin 指纹浏览器自动登录 Discord。"
        icon={Bot}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Configuration & Input (3/12) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Settings Card */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
              <Settings className="w-5 h-5" />
              <h3>配置设置</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800">
                  <p className="font-semibold mb-1">导入格式说明:</p>
                  <p className="mb-1">Excel/CSV: 窗口名称, 窗口ID, Token</p>
                  <p className="opacity-75">支持分隔符: 逗号(,) 竖线(|) 冒号(:)</p>
                  <p className="mt-2 font-semibold">如何获取窗口 ID?</p>
                  <p className="opacity-75">在 MoreLogin 客户端导出窗口信息即可批量获取。</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-600 dark:text-neutral-400">
                  MoreLogin API 地址
                </label>
                <input
                  type="text"
                  value={moreLoginApiUrl}
                  onChange={(e) => setMoreLoginApiUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-[#2c2c2e] border border-neutral-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  placeholder="http://127.0.0.1:40000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-600 dark:text-neutral-400">
                  MoreLogin App ID (可选)
                </label>
                <input
                  type="text"
                  value={moreLoginAppId}
                  onChange={(e) => setMoreLoginAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-[#2c2c2e] border border-neutral-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  placeholder="输入 App ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-600 dark:text-neutral-400">
                  MoreLogin Secret Key (可选)
                </label>
                <input
                  type="password"
                  value={moreLoginSecretKey}
                  onChange={(e) => setMoreLoginSecretKey(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-[#2c2c2e] border border-neutral-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  placeholder="输入 Secret Key"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoMatchProfile"
                  checked={autoMatchProfile}
                  onChange={(e) => setAutoMatchProfile(e.target.checked)}
                  className="w-4 h-4 text-[#0071e3] rounded border-neutral-300 focus:ring-[#0071e3]"
                />
                <label htmlFor="autoMatchProfile" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                  自动匹配环境 ID
                </label>
              </div>
              <p className="text-xs text-neutral-500 ml-6">
                勾选后，将根据邮箱(或Token模式下的备注)自动在 MoreLogin 中查找同名环境，无需手动填写环境 ID。
              </p>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="closeAfterLogin"
                  checked={closeAfterLogin}
                  onChange={(e) => setCloseAfterLogin(e.target.checked)}
                  className="w-4 h-4 text-[#0071e3] rounded border-neutral-300 focus:ring-[#0071e3]"
                />
                <label htmlFor="closeAfterLogin" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                  登录成功后关闭窗口
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium mb-1 text-neutral-600 dark:text-neutral-400">
                  并发线程数: {concurrency}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
                />
                <p className="text-xs text-neutral-500 mt-1">同时运行的浏览器窗口数量 (1-10)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Account List / Results (5/12) */}
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/10 flex flex-col h-[calc(100vh-140px)]">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">账号列表</h3>
                <div className="flex gap-2">
                    {!isProcessing ? (
                        <button
                            onClick={handleStart}
                            disabled={!inputData.trim()}
                            className={clsx(
                                "py-1.5 px-3 rounded-lg font-medium flex items-center gap-1.5 text-sm transition-all",
                                !inputData.trim()
                                ? "bg-neutral-100 dark:bg-[#2c2c2e] text-neutral-400 cursor-not-allowed"
                                : "bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm"
                            )}
                            title="开始任务"
                        >
                            <Play className="w-4 h-4" />
                            开始
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={togglePause}
                                className={clsx(
                                    "py-1.5 px-3 rounded-lg font-medium flex items-center gap-1.5 text-sm transition-all text-white shadow-sm",
                                    isPaused 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : "bg-yellow-500 hover:bg-yellow-600"
                                )}
                                title={isPaused ? "继续" : "暂停"}
                            >
                                {isPaused ? <PlayCircle className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                {isPaused ? "继续" : "暂停"}
                            </button>
                            <button
                                onClick={handleStop}
                                className="py-1.5 px-3 rounded-lg font-medium flex items-center gap-1.5 text-sm transition-all bg-red-500 hover:bg-red-600 text-white shadow-sm"
                                title="停止任务"
                            >
                                <Square className="w-4 h-4" />
                                停止
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
                <div className="flex gap-3 text-xs text-neutral-500">
                    <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {results.filter(r => r.status === "success").length} 成功
                    </span>
                    <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {results.filter(r => r.status === "error").length} 失败
                    </span>
                    {isProcessing && (
                        <span className="flex items-center gap-1 text-blue-600">
                            <Loader2 className={clsx("w-3 h-3", !isPaused && "animate-spin")} />
                            {isPaused ? "已暂停" : `处理中 (${currentProcessingIndex !== null ? currentProcessingIndex + 1 : 0}/${results.length})`}
                        </span>
                    )}
                </div>

                <div className="flex gap-3">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".txt,.csv,.xlsx,.xls"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 text-[#0071e3] hover:text-[#0077ed]"
                        title="导入账号列表"
                    >
                        <Upload className="w-4 h-4" />
                        导入
                    </button>
                    <button 
                        onClick={exportResults}
                        disabled={results.length === 0}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="导出结果"
                    >
                        <Download className="w-4 h-4" />
                        导出
                    </button>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                <Upload className="w-16 h-16 mb-4 opacity-20" />
                <p>请导入账号列表...</p>
                <p className="text-xs mt-2 opacity-60">支持 .txt 或 .csv 格式</p>
              </div>
            ) : (
              results.map((result, index) => (
                <div
                  key={index}
                  className={clsx(
                    "p-3 rounded-xl border text-sm font-mono transition-all",
                    result.status === "pending" && "bg-neutral-50 dark:bg-[#2c2c2e] border-transparent opacity-50",
                    result.status === "processing" && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                    result.status === "success" && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                    result.status === "error" && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold truncate max-w-[200px]" title={result.email}>{result.email}</span>
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-xs font-medium uppercase",
                      result.status === "pending" && "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400",
                      result.status === "processing" && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                      result.status === "success" && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
                      result.status === "error" && "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                    )}>
                      {result.status === "processing" ? "运行中" : result.status}
                    </span>
                  </div>
                  
                  {result.message && (
                    <div className="text-neutral-600 dark:text-neutral-400 text-xs truncate" title={result.message}>
                      {result.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Global Logs (4/12) */}
        <div className="col-span-12 lg:col-span-4 bg-[#1e1e1e] text-green-400 rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/10 flex flex-col h-[calc(100vh-140px)] font-mono text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="text-lg font-semibold text-white">运行日志</h3>
                <button onClick={() => setGlobalLogs([])} className="text-neutral-500 hover:text-white">清空</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {globalLogs.length === 0 ? (
                    <div className="text-neutral-600 italic">暂无日志...</div>
                ) : (
                    globalLogs.map((log, i) => (
                        <div key={i} className="break-all hover:bg-white/5 px-1 rounded">
                            {log}
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
      </div>
    </div>
  );
}