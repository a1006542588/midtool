"use client";

import { useState, Fragment } from "react";
import { Play, Trash2, Download, AlertCircle, CheckCircle, XCircle, Info, Database, RefreshCw, Globe } from "lucide-react";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

interface ProxyResult {
  original: string;
  ip?: string;
  country?: string;
  city?: string;
  isp?: string;
  latency?: number;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  isProxy?: boolean;
  isHosting?: boolean;
}

export default function ProxyChecker() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<ProxyResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [concurrency, setConcurrency] = useState(5);
  const [showDbModal, setShowDbModal] = useState(false);
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);
  const [dbUpdateMsg, setDbUpdateMsg] = useState("");
  const [defaultProtocol, setDefaultProtocol] = useState("http");

  const updateDb = async () => {
    setIsUpdatingDb(true);
    setDbUpdateMsg("正在下载数据库，请稍候...");
    
    try {
      const res = await fetch("/api/system/update-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Token is hardcoded in backend
      });
      const data = await res.json();
      
      if (data.success) {
        setDbUpdateMsg("数据库更新成功！");
        setTimeout(() => {
            setShowDbModal(false);
            setDbUpdateMsg("");
        }, 2000);
      } else {
        setDbUpdateMsg(`更新失败: ${data.error}`);
      }
    } catch (e: any) {
      setDbUpdateMsg(`更新失败: ${e.message}`);
    } finally {
      setIsUpdatingDb(false);
    }
  };

  const parseInput = () => {
    const lines = input.split("\n").filter((line) => line.trim() !== "");
    const initialResults: ProxyResult[] = lines.map((line) => {
        let original = line.trim();
        // If no protocol specified, prepend default
        if (!original.includes("://")) {
            const parts = original.split(":");
            if (parts.length === 4) {
                // ip:port:user:pass -> protocol://user:pass@ip:port
                original = `${defaultProtocol}://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
            } else {
                original = `${defaultProtocol}://${original}`;
            }
        }
        return {
            original,
            status: "pending",
        };
    });
    setResults(initialResults);
    return initialResults;
  };

  const checkProxy = async (proxy: string): Promise<Partial<ProxyResult>> => {
    try {
      const res = await fetch("/api/proxy-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxy }),
      });
      const data = await res.json();

      if (data.success) {
        return {
          status: "success",
          ...data.data,
        };
      } else {
        return {
          status: "error",
          error: data.error,
        };
      }
    } catch (e: any) {
      return {
        status: "error",
        error: e.message || "Network error",
      };
    }
  };

  const processQueue = async () => {
    if (isProcessing) return;
    
    // Always re-parse input to handle additions/removals/protocol changes
    const lines = input.split("\n").filter((line) => line.trim() !== "");
    
    if (lines.length === 0) {
        setResults([]);
        return;
    }

    const newResults: ProxyResult[] = lines.map((line) => {
        let original = line.trim();
        // Protocol logic
        if (!original.includes("://")) {
            const parts = original.split(":");
            if (parts.length === 4) {
                // ip:port:user:pass -> protocol://user:pass@ip:port
                const user = encodeURIComponent(parts[2]);
                const pass = encodeURIComponent(parts[3]);
                original = `${defaultProtocol}://${user}:${pass}@${parts[0]}:${parts[1]}`;
            } else {
                original = `${defaultProtocol}://${original}`;
            }
        }
        
        // Find existing result to preserve status
        const existing = results.find(r => r.original === original);
        return existing ? { ...existing } : { original, status: "pending" };
    });

    setResults(newResults);
    
    // Use newResults for processing
    const currentQueue = newResults;

    setIsProcessing(true);
    
    // Filter pending items
    const pendingIndices = currentQueue
      .map((item, index) => (item.status === "pending" || item.status === "error" ? index : -1))
      .filter((index) => index !== -1);

    // Process in chunks based on concurrency
    for (let i = 0; i < pendingIndices.length; i += concurrency) {
      const chunkIndices = pendingIndices.slice(i, i + concurrency);
      
      // Mark as processing
      setResults((prev) => {
        const next = [...prev];
        chunkIndices.forEach((idx) => {
          next[idx].status = "processing";
        });
        return next;
      });

      // Execute checks
      const promises = chunkIndices.map((idx) => checkProxy(currentQueue[idx].original));
      const chunkResults = await Promise.all(promises);

      // Update results
      setResults((prev) => {
        const next = [...prev];
        chunkIndices.forEach((idx, chunkIdx) => {
          next[idx] = { ...next[idx], ...chunkResults[chunkIdx] };
        });
        return next;
      });
    }

    setIsProcessing(false);
  };

  const exportExcel = () => {
    const data = results.map((r) => ({
      "原始数据": r.original,
      "状态": r.status === "success" ? "成功" : "失败",
      "IP": r.ip || "-",
      "归属地": r.country ? `${r.country} ${r.city || ""}` : "-",
      "ISP": r.isp || "-",
      "延迟(ms)": r.latency || "-",
      "类型": r.isHosting ? "机房" : (r.isProxy ? "代理" : "住宅/其他"),
      "错误信息": r.error || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ProxyCheckResults");
    XLSX.writeFile(wb, `proxy_check_${new Date().getTime()}.xlsx`);
  };

  const getLatencyColor = (ms?: number) => {
    if (ms === undefined) return "text-gray-400";
    if (ms < 200) return "text-green-600";
    if (ms < 500) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="IP检测"
        description="批量检测代理 IP 的连通性及延迟，支持多种协议。"
        icon={Globe}
      />
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Panel: Input & Controls */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info size={20} />
              使用说明
            </h2>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2 mb-6">
              <p>支持批量检测代理 IP 的连通性及延迟。</p>
              <p className="font-semibold">支持格式：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>ip:port</li>
                <li>ip:port:user:pass</li>
                <li>protocol://ip:port</li>
                <li>protocol://user:pass@ip:port</li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowDbModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
              >
                <Database size={16} />
                更新 IP 数据库
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">默认协议</label>
                <select
                  value={defaultProtocol}
                  onChange={(e) => setDefaultProtocol(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
                <p className="text-xs text-neutral-400 mt-1">
                  当输入不包含协议头时，将使用此协议。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">代理列表</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-48 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-xs resize-none focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                  placeholder="192.168.1.1:8080&#10;user:pass@192.168.1.1:8080"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">并发数 ({concurrency})</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value))}
                  className="w-full accent-brand"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={processQueue}
                  disabled={isProcessing || !input.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      检测中...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      开始检测
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setInput("");
                    setResults([]);
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="w-full md:w-2/3">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-[800px]">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="font-bold">检测结果</h2>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-400">
                    总数: {results.length}
                  </span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                    成功: {results.filter(r => r.status === "success").length}
                  </span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                    失败: {results.filter(r => r.status === "error").length}
                  </span>
                </div>
              </div>
              {results.length > 0 && (
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-brand transition-colors"
                >
                  <Download size={16} />
                  导出 Excel
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium z-10">
                  <tr>
                    <th className="px-4 py-3 w-12">#</th>
                    <th className="px-4 py-3">IP / 归属地</th>
                    <th className="px-4 py-3">延迟</th>
                    <th className="px-4 py-3">ISP / 类型</th>
                    <th className="px-4 py-3">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {results.map((row, idx) => (
                    <Fragment key={idx}>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          {row.status === "success" ? (
                            <div>
                              <div className="font-mono font-medium">{row.ip}</div>
                              <div className="text-xs text-neutral-500">{row.country} {row.city}</div>
                            </div>
                          ) : (
                            <div className="text-neutral-400 font-mono text-xs truncate max-w-[150px]" title={row.original}>
                              {row.original}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-3 font-mono ${getLatencyColor(row.latency)}`}>
                          {row.latency ? `${row.latency}ms` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {row.status === "success" ? (
                            <div className="text-xs">
                              <div className="truncate max-w-[120px]" title={row.isp}>{row.isp}</div>
                              <div className="flex gap-1 mt-1">
                                {row.isHosting && <span className="px-1 bg-red-100 text-red-600 rounded text-[10px]">机房</span>}
                                {row.isProxy && <span className="px-1 bg-yellow-100 text-yellow-600 rounded text-[10px]">代理</span>}
                                {!row.isHosting && !row.isProxy && <span className="px-1 bg-green-100 text-green-600 rounded text-[10px]">住宅</span>}
                              </div>
                            </div>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {row.status === "pending" && <span className="text-neutral-400">等待中</span>}
                          {row.status === "processing" && <span className="text-blue-500 animate-pulse">检测中...</span>}
                          {row.status === "success" && <CheckCircle size={18} className="text-green-500" />}
                          {row.status === "error" && (
                            <div className="flex items-center gap-1 text-red-500" title={row.error}>
                              <XCircle size={18} />
                              <span className="text-xs max-w-[100px] truncate">{row.error}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle size={32} className="opacity-20" />
                          <p>暂无数据，请在左侧添加代理并开始检测</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DB Update Modal */}
      {showDbModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl w-full max-w-md shadow-xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Database size={20} />
              更新 IP2Location 数据库
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              点击下方按钮开始下载最新的 DB11.LITE 数据库。
            </p>
            
            <div className="space-y-4">
              {dbUpdateMsg && (
                <div className={`text-sm p-2 rounded ${dbUpdateMsg.includes("成功") ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                  {dbUpdateMsg}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md"
                  disabled={isUpdatingDb}
                >
                  取消
                </button>
                <button 
                  onClick={updateDb}
                  disabled={isUpdatingDb}
                  className="px-4 py-2 text-sm bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingDb && <RefreshCw size={14} className="animate-spin" />}
                  {isUpdatingDb ? "更新中..." : "开始更新"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
