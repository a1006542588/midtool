"use client";

import { useState } from "react";
import { 
  Mail, 
  Filter, 
  Copy, 
  Trash2, 
  Download, 
  Plus, 
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

export default function EmailProcessor() {
  const [inputText, setInputText] = useState("");
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);
  const [filterDomain, setFilterDomain] = useState("");
  const [filterMode, setFilterMode] = useState<"keep" | "remove">("keep");
  const [aliasTag, setAliasTag] = useState("");
  const [aliasMode, setAliasMode] = useState<"suffix" | "dot">("suffix");
  const [stats, setStats] = useState({ total: 0, valid: 0, duplicates: 0 });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const extractEmails = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
    return text.match(emailRegex) || [];
  };

  const processEmails = () => {
    if (!inputText.trim()) {
      showNotification("error", "请输入需要处理的文本");
      return;
    }

    let emails: string[] = extractEmails(inputText);
    const totalFound = emails.length;
    
    // 去重
    const uniqueEmails = Array.from(new Set(emails));
    const duplicatesCount = totalFound - uniqueEmails.length;

    // 域名过滤
    if (filterDomain) {
      const domains = filterDomain.split(",").map(d => d.trim().toLowerCase()).filter(Boolean);
      if (domains.length > 0) {
        emails = uniqueEmails.filter(email => {
          const domain = email.split("@")[1].toLowerCase();
          const match = domains.some(d => domain.includes(d));
          return filterMode === "keep" ? match : !match;
        });
      } else {
        emails = uniqueEmails;
      }
    } else {
      emails = uniqueEmails;
    }

    // 别名生成
    if (aliasTag) {
      emails = emails.map(email => {
        const [local, domain] = email.split("@");
        if (aliasMode === "suffix") {
          // Gmail style: user+tag@gmail.com
          return `${local}+${aliasTag}@${domain}`;
        } else if (aliasMode === "dot") {
          // Dot injection (randomly insert dots) - simplified version just adds one dot
          // For a real dot generator we'd need more logic, but let's stick to suffix for now or simple append
          return `${local}.${aliasTag}@${domain}`; 
        }
        return email;
      });
    }

    setProcessedEmails(emails);
    setStats({
      total: totalFound,
      valid: emails.length,
      duplicates: duplicatesCount
    });
    showNotification("success", `处理完成：找到 ${totalFound} 个邮箱，结果 ${emails.length} 个`);
  };

  const copyToClipboard = () => {
    if (processedEmails.length === 0) return;
    navigator.clipboard.writeText(processedEmails.join("\n"));
    showNotification("success", "已复制到剪贴板");
  };

  const exportToExcel = () => {
    if (processedEmails.length === 0) return;
    
    const ws = XLSX.utils.aoa_to_sheet([["Email"], ...processedEmails.map(e => [e])]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Emails");
    XLSX.writeFile(wb, `emails_processed_${new Date().getTime()}.xlsx`);
    showNotification("success", "Excel 导出成功");
  };

  const clearAll = () => {
    setInputText("");
    setProcessedEmails([]);
    setStats({ total: 0, valid: 0, duplicates: 0 });
    setFilterDomain("");
    setAliasTag("");
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="邮箱处理工具"
        description="批量提取、过滤、去重和生成邮箱别名，支持 Excel 导出。"
        icon={Mail}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">输入文本</h2>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="在此粘贴包含邮箱的文本，支持混合内容..."
              className="flex-1 w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
              style={{ minHeight: "300px" }}
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              处理选项
            </h2>
            
            <div className="space-y-6">
              {/* Domain Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  域名过滤
                </label>
                <div className="flex gap-2">
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value as "keep" | "remove")}
                    className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="keep">保留</option>
                    <option value="remove">排除</option>
                  </select>
                  <input
                    type="text"
                    value={filterDomain}
                    onChange={(e) => setFilterDomain(e.target.value)}
                    placeholder="gmail.com, outlook.com"
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">多个域名用逗号分隔</p>
              </div>

              {/* Alias Generator */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  别名生成
                </label>
                <div className="flex gap-2">
                  <select
                    value={aliasMode}
                    onChange={(e) => setAliasMode(e.target.value as "suffix" | "dot")}
                    className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="suffix">后缀 (+tag)</option>
                    <option value="dot">点号 (.tag)</option>
                  </select>
                  <input
                    type="text"
                    value={aliasTag}
                    onChange={(e) => setAliasTag(e.target.value)}
                    placeholder="tag"
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">为邮箱添加后缀或标签</p>
              </div>

              <button
                onClick={processEmails}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                开始处理
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">统计信息</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">总数</div>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-green-600 dark:text-green-400">有效</div>
                <div className="font-bold text-green-700 dark:text-green-300">{stats.valid}</div>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-xs text-orange-600 dark:text-orange-400">重复</div>
                <div className="font-bold text-orange-700 dark:text-orange-300">{stats.duplicates}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">处理结果</h2>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  disabled={processedEmails.length === 0}
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title="复制结果"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={processedEmails.length === 0}
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title="导出 Excel"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 overflow-auto" style={{ maxHeight: "500px" }}>
              {processedEmails.length > 0 ? (
                <div className="space-y-1">
                  {processedEmails.map((email, index) => (
                    <div key={index} className="text-sm font-mono text-neutral-700 dark:text-neutral-300 break-all py-1 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                      {email}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
                  <Mail className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">暂无结果</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white animate-fade-in ${
          notification.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}
    </div>
  );
}
