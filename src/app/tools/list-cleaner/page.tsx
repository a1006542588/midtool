"use client";

import { useState } from "react";
import { ArrowLeft, Copy, Trash2, Filter, Shuffle, ArrowDownAZ, Scissors, Eraser, CheckCircle2, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

export default function ListCleaner() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState({ inputLines: 0, outputLines: 0, removed: 0 });
  const [notification, setNotification] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2000);
  };

  const processList = (action: "dedupe" | "trim" | "empty" | "shuffle" | "sort" | "all") => {
    if (!input) return;

    let lines = input.split("\n");
    const originalCount = lines.length;

    switch (action) {
      case "dedupe":
        lines = Array.from(new Set(lines));
        break;
      case "trim":
        lines = lines.map(l => l.trim());
        break;
      case "empty":
        lines = lines.filter(l => l.trim() !== "");
        break;
      case "shuffle":
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        break;
      case "sort":
        lines.sort();
        break;
      case "all":
        // Clean All: Trim -> Remove Empty -> Dedupe
        lines = lines.map(l => l.trim()).filter(l => l !== "");
        lines = Array.from(new Set(lines));
        break;
    }

    const result = lines.join("\n");
    setOutput(result);
    setStats({
      inputLines: originalCount,
      outputLines: lines.length,
      removed: originalCount - lines.length
    });
    
    const actionNames = {
      dedupe: "已去重",
      trim: "已去除首尾空格",
      empty: "已去除空行",
      shuffle: "已打乱顺序",
      sort: "已排序",
      all: "已执行一键清洗"
    };
    showNotification(actionNames[action]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    showNotification("已复制到剪贴板");
  };

  const exportToExcel = () => {
    if (!output) return;
    const lines = output.split("\n").map(line => [line]);
    const ws = XLSX.utils.aoa_to_sheet([["Data"], ...lines]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cleaned List");
    XLSX.writeFile(wb, "cleaned_list.xlsx");
    showNotification("已导出 Excel");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <ToolHeader
        title="列表去重清洗"
        description="高效处理文本列表。支持一键去重、去除空行、打乱顺序、去除首尾空格，是处理账号库的必备神器。"
        icon={Filter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              输入列表
              <span className="ml-2 text-xs text-neutral-400 font-normal">
                (当前: {input ? input.split("\n").length : 0} 行)
              </span>
            </label>
            <button 
              onClick={() => { setInput(""); setOutput(""); setStats({ inputLines: 0, outputLines: 0, removed: 0 }); }}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 size={12} />
              清空
            </button>
          </div>
          <textarea
            className="w-full h-[500px] p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-brand outline-none font-mono text-sm resize-none"
            placeholder={`user1:pass1\nuser2:pass2\nuser1:pass1\n...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Actions & Output Section */}
        <div className="space-y-6">
          
          {/* Action Buttons */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">操作选项</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => processList("dedupe")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Filter size={16} />
                去除重复
              </button>
              <button
                onClick={() => processList("empty")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Eraser size={16} />
                去除空行
              </button>
              <button
                onClick={() => processList("trim")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Scissors size={16} />
                去首尾空格
              </button>
              <button
                onClick={() => processList("shuffle")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Shuffle size={16} />
                打乱顺序
              </button>
              <button
                onClick={() => processList("sort")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowDownAZ size={16} />
                A-Z 排序
              </button>
              <button
                onClick={() => processList("all")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white hover:bg-brand/90 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <CheckCircle2 size={16} />
                一键清洗 (全套)
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                处理结果
                {stats.outputLines > 0 && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                    (共 {stats.outputLines} 行, 已移除 {stats.removed} 行)
                  </span>
                )}
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
              className="w-full h-[240px] p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 focus:border-brand outline-none font-mono text-sm resize-none text-neutral-600 dark:text-neutral-300"
              placeholder="处理后的结果将显示在这里..."
              value={output}
            />
          </div>
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
