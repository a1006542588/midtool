"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, Search, UserCheck, Download, Trash2, Copy, CheckCircle, XCircle, AlertCircle, Loader2, Code, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

type Log = {
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
};

type TwitterProfile = {
  username: string;
  status?: string;
  data?: any;
  error?: string;
  // Parsed fields for table
  avatar?: string;
  bio?: string;
  tweetsCount?: number | string;
  followingCount?: number | string;
  followersCount?: number | string;
  createdAt?: string;
  isProtected?: boolean;
};

export default function TwitterChecker() {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<TwitterProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"status" | "profile">("profile");

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const addLog = (type: "info" | "success" | "error", message: string) => {
    setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type, message }, ...prev]);
  };

  const clearLogs = () => setLogs([]);
  const clearResults = () => setResults([]);

  // Helper to safely extract data from various potential API structures
  const parseProfileData = (data: any) => {
    if (!data) return {};
    
    // Recursive function to find an object that looks like a user profile
    const findUserObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Check for characteristic fields of a Twitter profile
      if ('followers_count' in obj || 'friends_count' in obj || 'statuses_count' in obj) {
        return obj;
      }
      
      // If it has a 'legacy' field (common in GraphQL), check that first
      if (obj.legacy && typeof obj.legacy === 'object') {
         const found = findUserObject(obj.legacy);
         if (found) return found;
      }

      // Iterate through keys
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const found = findUserObject(obj[key]);
          if (found) return found;
        }
      }
      return null;
    };

    let user = findUserObject(data);
    
    // Fallback: if data itself is the user object (or close to it)
    if (!user) user = data;

    return {
      avatar: user.profile_image_url_https || user.profile_image_url || user.avatar || "",
      bio: user.description || user.bio || "",
      tweetsCount: user.statuses_count || user.tweets_count || user.media_count || 0,
      followingCount: user.friends_count || user.following_count || user.following || 0,
      followersCount: user.followers_count || user.followers || 0,
      createdAt: user.created_at || user.created_date || user.join_date || "",
      isProtected: user.protected || false
    };
  };

  const handleProcess = async () => {
    const usernames = input.split(/[\n, ]+/).map(s => s.trim()).filter(s => s);
    if (usernames.length === 0) {
      addLog("error", "请输入推特用户名");
      return;
    }

    setIsProcessing(true);
    setResults([]);
    addLog("info", `开始处理 ${usernames.length} 个账号...`);

    const newResults: TwitterProfile[] = [];

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      // Remove @ if present
      const cleanUsername = username.startsWith("@") ? username.slice(1) : username;
      
      addLog("info", `正在查询: ${cleanUsername}...`);

      try {
        let endpoint = "";
        let body = {};

        if (activeTab === "status") {
          endpoint = "https://midapi.midaccs.com/api/v1/check_account_text";
          body = { username: cleanUsername };
        } else {
          endpoint = "https://midapi.midaccs.com/api/v1/get_profile";
          body = { username: cleanUsername };
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: JSON.stringify(body),
          redirect: 'follow' as RequestRedirect
        };

        const response = await fetch(endpoint, requestOptions);
        const resultText = await response.text();
        
        let resultData;
        try {
            resultData = JSON.parse(resultText);
        } catch {
            resultData = resultText;
        }

        addLog("success", `查询成功: ${cleanUsername}`);
        
        const parsed = parseProfileData(resultData);

        newResults.push({
          username: cleanUsername,
          data: resultData,
          ...parsed
        });
        
        setResults([...newResults]);

      } catch (error: any) {
        addLog("error", `查询失败 ${cleanUsername}: ${error.message}`);
        newResults.push({
          username: cleanUsername,
          error: error.message
        });
        setResults([...newResults]);
      }
      
      // Small delay to avoid rate limits if necessary
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
    addLog("success", "所有任务处理完成");
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const dataToExport = results.map(res => {
      let createdYear = "-";
      if (res.createdAt) {
        try {
          const date = new Date(res.createdAt);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          createdYear = `${year}-${month}`;
        } catch (e) {
          createdYear = res.createdAt;
        }
      }

      return {
        "用户名": res.username,
        "状态": res.error ? "异常" : res.isProtected ? "隐私" : "正常",
        "简介": res.bio || "-",
        "帖子数": res.tweetsCount || 0,
        "关注数": res.followingCount || 0,
        "粉丝数": res.followersCount || 0,
        "注册时间": createdYear,
        "错误信息": res.error || ""
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `twitter_check_results_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6">
      <ToolHeader
        title="推特账号查询"
        description="批量查询推特账号状态及详细信息。"
        icon={Search}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Search size={18} />
                输入账号
              </h2>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={clsx(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    activeTab === "profile"
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  获取详情
                </button>
                <button
                  onClick={() => setActiveTab("status")}
                  className={clsx(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    activeTab === "status"
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  检测状态
                </button>
              </div>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入推特用户名，每行一个&#10;例如：&#10;elonmusk&#10;nasa"
              className="w-full h-64 p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg font-mono text-sm focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white outline-none resize-none"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleProcess}
                disabled={isProcessing || !input.trim()}
                className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 h-10 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
                {isProcessing ? "处理中..." : activeTab === "profile" ? "查询详情" : "检测状态"}
              </button>
              <button
                onClick={() => setInput("")}
                disabled={isProcessing}
                className="px-4 h-10 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
                title="清空输入"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">运行日志</h2>
              <button onClick={clearLogs} className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                清空
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className={clsx(
                  "flex gap-2",
                  log.type === "error" ? "text-red-500" : 
                  log.type === "success" ? "text-green-500" : 
                  "text-neutral-500"
                )}>
                  <span className="opacity-50">[{log.timestamp}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-neutral-400 italic text-center mt-10">暂无日志</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm h-[600px] flex flex-col">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle size={18} />
                  查询结果
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={exportResults}
                    disabled={results.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    <Download size={14} />
                    导出 Excel
                  </button>
                  <button
                    onClick={clearResults}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                    清空
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex gap-4 text-sm">
                 <div className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    总数: <span className="font-bold text-neutral-900 dark:text-white">{results.length}</span>
                 </div>
                 <div className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    正常: <span className="font-bold">{results.filter(r => !r.error && !r.isProtected).length}</span>
                 </div>
                 <div className="px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                    隐私: <span className="font-bold">{results.filter(r => !r.error && r.isProtected).length}</span>
                 </div>
                 <div className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    异常: <span className="font-bold">{results.filter(r => r.error).length}</span>
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                  <Search size={48} className="mb-4 opacity-20" />
                  <p>在左侧输入用户名并开始查询</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-medium">用户</th>
                        <th className="px-4 py-3 font-medium w-1/3">简介</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">帖子</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">关注</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">粉丝</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">注册年份</th>
                        <th className="px-4 py-3 font-medium text-center whitespace-nowrap">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {results.map((res, idx) => (
                        <Fragment key={idx}>
                        <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <a 
                              href={`https://twitter.com/${res.username}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 group"
                            >
                              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-neutral-400 transition-all">
                                {res.avatar ? (
                                  <img src={res.avatar} alt={res.username} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                    <UserCheck size={20} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-500 transition-colors">@{res.username}</div>
                              </div>
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <div className="line-clamp-2 text-neutral-600 dark:text-neutral-400 text-xs" title={res.bio}>
                              {res.bio || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {res.tweetsCount?.toLocaleString() || "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {res.followingCount?.toLocaleString() || "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {res.followersCount?.toLocaleString() || "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {(() => {
                              if (!res.createdAt) return "-";
                              try {
                                const d = new Date(res.createdAt);
                                const year = d.getFullYear();
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                return `${year}-${month}`;
                              } catch {
                                return "-";
                              }
                            })()}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {res.error ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                异常
                              </span>
                            ) : res.isProtected ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                隐私
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                正常
                              </span>
                            )}
                          </td>
                        </tr>
                        {expandedRow === idx && (
                          <tr>
                            <td colSpan={7} className="px-4 py-3 bg-neutral-50 dark:bg-neutral-950">
                              <div className="text-xs font-mono overflow-x-auto max-h-60 p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded">
                                <pre>{JSON.stringify(res.data, null, 2)}</pre>
                              </div>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}