"use client";

import { useState, useMemo } from "react";
import { GitCompare, Copy, Download, Trash2, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";
import clsx from "clsx";
import { ToolHeader } from "@/components/ToolHeader";

export default function ListDiff() {
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [mode, setMode] = useState<"a-b" | "b-a" | "intersection" | "union">("a-b");
  const [ignoreCase, setIgnoreCase] = useState(false);

  const result = useMemo(() => {
    const listA = inputA.split("\n").map(l => l.trim()).filter(l => l);
    const listB = inputB.split("\n").map(l => l.trim()).filter(l => l);
    
    const setA = new Set(ignoreCase ? listA.map(l => l.toLowerCase()) : listA);
    const setB = new Set(ignoreCase ? listB.map(l => l.toLowerCase()) : listB);

    // Helper to get original case if possible (first match)
    const getOriginal = (val: string, sourceList: string[]) => {
        if (!ignoreCase) return val;
        return sourceList.find(l => l.toLowerCase() === val) || val;
    };

    let res: string[] = [];

    if (mode === "a-b") {
      // In A but not in B
      res = listA.filter(item => !setB.has(ignoreCase ? item.toLowerCase() : item));
    } else if (mode === "b-a") {
      // In B but not in A
      res = listB.filter(item => !setA.has(ignoreCase ? item.toLowerCase() : item));
    } else if (mode === "intersection") {
      // In both A and B
      res = listA.filter(item => setB.has(ignoreCase ? item.toLowerCase() : item));
    } else if (mode === "union") {
      // All unique items
      const combined = [...listA, ...listB];
      const seen = new Set();
      res = combined.filter(item => {
        const key = ignoreCase ? item.toLowerCase() : item;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return res;
  }, [inputA, inputB, mode, ignoreCase]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.join("\n"));
  };

  const exportExcel = () => {
    if (result.length === 0) return;
    const data = result.map(line => ({ "Result": line }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Diff Result");
    XLSX.writeFile(wb, `list_diff_${mode}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="列表交集差集"
        description="比较两个文本列表，快速计算交集、并集、差集，支持去重。"
        icon={GitCompare}
      />
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    checked={ignoreCase} 
                    onChange={() => setIgnoreCase(!ignoreCase)}
                    className="rounded border-neutral-300 text-brand focus:ring-brand"
                />
                忽略大小写
            </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Input A */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="font-medium text-sm">列表 A ({inputA.split("\n").filter(l=>l.trim()).length})</label>
            <button onClick={() => setInputA("")} className="text-neutral-400 hover:text-red-500">
                <Trash2 size={16} />
            </button>
          </div>
          <textarea
            className="flex-1 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 resize-none font-mono text-xs focus:ring-2 focus:ring-brand outline-none"
            placeholder="每行一个数据..."
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
          />
        </div>

        {/* Controls & Result */}
        <div className="flex flex-col gap-4">
            {/* Operation Selector */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">运算模式</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setMode("a-b")}
                        className={clsx(
                            "px-3 py-2 text-xs rounded-lg border transition-all text-left",
                            mode === "a-b" ? "bg-brand/10 border-brand text-brand" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <div className="font-bold">A - B (差集)</div>
                        <div className="text-[10px] opacity-70">在 A 中但不在 B 中</div>
                    </button>
                    <button
                        onClick={() => setMode("b-a")}
                        className={clsx(
                            "px-3 py-2 text-xs rounded-lg border transition-all text-left",
                            mode === "b-a" ? "bg-brand/10 border-brand text-brand" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <div className="font-bold">B - A (差集)</div>
                        <div className="text-[10px] opacity-70">在 B 中但不在 A 中</div>
                    </button>
                    <button
                        onClick={() => setMode("intersection")}
                        className={clsx(
                            "px-3 py-2 text-xs rounded-lg border transition-all text-left",
                            mode === "intersection" ? "bg-brand/10 border-brand text-brand" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <div className="font-bold">A ∩ B (交集)</div>
                        <div className="text-[10px] opacity-70">同时在 A 和 B 中</div>
                    </button>
                    <button
                        onClick={() => setMode("union")}
                        className={clsx(
                            "px-3 py-2 text-xs rounded-lg border transition-all text-left",
                            mode === "union" ? "bg-brand/10 border-brand text-brand" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <div className="font-bold">A ∪ B (并集)</div>
                        <div className="text-[10px] opacity-70">A 和 B 的所有不重复项</div>
                    </button>
                </div>
            </div>

            {/* Result Area */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <label className="font-medium text-sm">运算结果 ({result.length})</label>
                    <div className="flex gap-2">
                        <button
                            onClick={exportExcel}
                            disabled={result.length === 0}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
                        >
                            <Download size={14} /> Excel
                        </button>
                        <button
                            onClick={copyToClipboard}
                            disabled={result.length === 0}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                            <Copy size={14} /> 复制
                        </button>
                    </div>
                </div>
                <textarea
                    readOnly
                    className="flex-1 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 resize-none font-mono text-xs focus:ring-2 focus:ring-brand outline-none"
                    value={result.join("\n")}
                    placeholder="结果将显示在这里..."
                />
            </div>
        </div>

        {/* Input B */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="font-medium text-sm">列表 B ({inputB.split("\n").filter(l=>l.trim()).length})</label>
            <button onClick={() => setInputB("")} className="text-neutral-400 hover:text-red-500">
                <Trash2 size={16} />
            </button>
          </div>
          <textarea
            className="flex-1 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 resize-none font-mono text-xs focus:ring-2 focus:ring-brand outline-none"
            placeholder="每行一个数据..."
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
