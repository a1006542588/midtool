"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Copy, RefreshCw, Settings2, ArrowRight, Trash2, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

export default function FormatConverter() {
  const [input, setInput] = useState("");
  const [inputSeparator, setInputSeparator] = useState("auto");
  const [customInputSeparator, setCustomInputSeparator] = useState("");
  const [outputTemplate, setOutputTemplate] = useState("{0}:{1}:{2}:{3}");
  const [notification, setNotification] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2000);
  };

  const detectedSeparator = useMemo(() => {
    if (!input || inputSeparator !== "auto") return inputSeparator;
    
    const firstLine = input.split("\n").find(l => l.trim() !== "") || "";
    if (!firstLine) return ":";

    const candidates = [":", "|", "----", ",", "\t", " "];
    let bestSep = ":";
    let maxCount = 0;

    for (const sep of candidates) {
      const count = firstLine.split(sep).length - 1;
      if (count > maxCount) {
        maxCount = count;
        bestSep = sep;
      }
    }
    return bestSep;
  }, [input, inputSeparator]);

  const actualInputSeparator = inputSeparator === "custom" ? customInputSeparator : (inputSeparator === "auto" ? detectedSeparator : inputSeparator);

  const previewData = useMemo(() => {
    if (!input) return [];
    const lines = input.split("\n").filter(l => l.trim() !== "").slice(0, 3);
    return lines.map(line => line.split(actualInputSeparator));
  }, [input, actualInputSeparator]);

  const output = useMemo(() => {
    if (!input) return "";
    const lines = input.split("\n");
    
    return lines.map(line => {
      if (!line.trim()) return "";
      const parts = line.split(actualInputSeparator);
      
      // Replace {0}, {1}, etc. with parts
      let result = outputTemplate;
      
      // Check if template is JSON
      const isJson = outputTemplate.trim().startsWith("{") || outputTemplate.trim().startsWith("[");
      
      if (isJson) {
          // For JSON, we might want to be careful about escaping, but for simple replacement:
          // A better way for JSON might be to construct an object if the user provides a JSON structure, 
          // but here we are doing string replacement.
          // Let's stick to simple string replacement for flexibility.
      }

      // Replace {0}, {1}... with values
      // We use a regex to replace all occurrences
      result = result.replace(/\{(\d+)\}/g, (match, index) => {
        const i = parseInt(index);
        return parts[i] !== undefined ? parts[i].trim() : "";
      });

      return result;
    }).filter(l => l !== "").join("\n");
  }, [input, actualInputSeparator, outputTemplate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    showNotification("已复制到剪贴板");
  };

  const exportToExcel = () => {
    if (!output) return;
    const lines = output.split("\n").map(line => [line]);
    const ws = XLSX.utils.aoa_to_sheet([["Converted Data"], ...lines]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Converted");
    XLSX.writeFile(wb, "converted_data.xlsx");
    showNotification("已导出 Excel");
  };

  const presets = [
    { name: "IP:Port:User:Pass", template: "{0}:{1}:{2}:{3}" },
    { name: "User:Pass@IP:Port", template: "{2}:{3}@{0}:{1}" },
    { name: "JSON Object", template: `{"ip": "{0}", "port": "{1}", "user": "{2}", "pass": "{3}"},` },
    { name: "Clash Proxy", template: `- { name: "Proxy-{0}", type: socks5, server: {0}, port: {1}, username: {2}, password: {3} }` },
    { name: "AdsPower/BitBrowser", template: "{0}:{1}:{2}:{3}" }, // Usually standard
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <ToolHeader
        title="格式转换工具"
        description="灵活转换账号/代理格式。支持自定义分隔符与输出模板，轻松将 user:pass 转换为 JSON 或其他格式。"
        icon={RefreshCw}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              输入数据
            </label>
            <div className="flex items-center gap-2">
               <select 
                value={inputSeparator}
                onChange={(e) => setInputSeparator(e.target.value)}
                className="text-xs bg-neutral-100 dark:bg-neutral-800 border-none rounded px-2 py-1 outline-none"
              >
                <option value="auto">自动识别 {inputSeparator === "auto" && `(${detectedSeparator})`}</option>
                <option value=":">冒号 (:)</option>
                <option value="|">竖线 (|)</option>
                <option value="----">四横杠 (----)</option>
                <option value="custom">自定义</option>
              </select>
              {inputSeparator === "custom" && (
                <input 
                  type="text" 
                  placeholder="分隔符"
                  className="w-16 text-xs bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1 outline-none border border-neutral-200 dark:border-neutral-700"
                  value={customInputSeparator}
                  onChange={(e) => setCustomInputSeparator(e.target.value)}
                />
              )}
            </div>
          </div>
          <textarea
            className="w-full h-[500px] p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-brand outline-none font-mono text-sm resize-none"
            placeholder={`192.168.1.1:8080:user:pass\n192.168.1.2:8080:user:pass\n...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Middle: Configuration */}
        <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 text-brand font-medium text-sm">
              <Settings2 size={16} />
              <span>转换配置</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-neutral-500">输出模板</label>
              <input 
                type="text" 
                className="w-full p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-mono focus:border-brand outline-none"
                value={outputTemplate}
                onChange={(e) => setOutputTemplate(e.target.value)}
              />
              <p className="text-[10px] text-neutral-400">
                使用 {"{0}"}, {"{1}"} 代表第1、2列数据
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-500">常用预设</label>
              <div className="flex flex-col gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setOutputTemplate(preset.template)}
                    className="text-left px-3 py-2 rounded bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs transition-colors truncate"
                    title={preset.template}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview of parsed columns */}
          {previewData.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">字段识别预览</h4>
              <div className="space-y-1">
                {previewData[0].map((col, idx) => (
                  <div key={idx} className="text-xs flex gap-2">
                    <span className="font-mono text-blue-400 shrink-0">{"{"}{idx}{"}"}</span>
                    <span className="truncate text-blue-800 dark:text-blue-200">{col}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              转换结果
            </label>
            <button 
              onClick={copyToClipboard}
              disabled={!output}
              className="text-xs text-brand hover:text-brand/80 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy size={12} />
              复制结果
            </button>
            <button 
              onClick={exportToExcel}
              disabled={!output}
              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={12} />
              导出 Excel
            </button>
          </div>
          <textarea
            readOnly
            className="w-full h-[500px] p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 focus:border-brand outline-none font-mono text-sm resize-none text-neutral-600 dark:text-neutral-300"
            placeholder="转换后的结果..."
            value={output}
          />
        </div>

      </div>

      {/* Notification Toast */}
      <div className={clsx(
        "fixed bottom-8 right-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform",
        notification ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      )}>
        {notification}
      </div>
    </div>
  );
}
