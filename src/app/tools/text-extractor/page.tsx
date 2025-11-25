"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Settings2, ArrowRightLeft, Table as TableIcon, FileSpreadsheet, Regex, Split, Wand2, Plus, Trash2, ChevronRight } from "lucide-react";
import clsx from "clsx";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

type SmartRule = 
  | { type: "split"; index: number }
  | { type: "between"; start: string; end: string };

export default function TextExtractor() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"split" | "regex" | "smart">("split");
  
  // Split Mode State
  const [separator, setSeparator] = useState(":");
  // const [customSeparator, setCustomSeparator] = useState(""); // Removed duplicate declaration
  
  // Regex Mode State
  const [regexPattern, setRegexPattern] = useState("");

  // Smart Mode State
  const [smartRules, setSmartRules] = useState<SmartRule[]>([]);
  
  // Common State
  const [selectedColumns, setSelectedColumns] = useState<number[]>([0]);
  const [outputTemplate, setOutputTemplate] = useState(""); 
  const [useTemplate, setUseTemplate] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [customSeparator, setCustomSeparator] = useState(""); // Initialize with empty string

  // Sample data for preview (first 5 lines)
  const previewLines = useMemo(() => {
    return input.split("\n").slice(0, 5).filter(line => line.trim() !== "");
  }, [input]);

  const autoGenerateSmartRules = () => {
    if (!input) return;
    const firstLine = input.split("\n")[0];
    if (!firstLine) return;

    const sep = separator === "custom" ? customSeparator : separator;
    const actualSep = sep === "\\t" ? "\t" : sep === "\\n" ? "\n" : sep;
    
    if (!actualSep) {
        setSmartRules([{ type: "split", index: 1 }]);
        return;
    }

    const parts = firstLine.split(actualSep);
    const newRules: SmartRule[] = parts.map((_, idx) => ({
      type: "split",
      index: idx + 1
    }));
    setSmartRules(newRules);
  };

  // Auto-generate rules when entering smart mode if empty
  useEffect(() => {
    if (mode === "smart" && smartRules.length === 0 && input) {
      autoGenerateSmartRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Detect columns based on the first valid line
  const detectedColumns = useMemo(() => {
    if (mode === "smart") {
      if (smartRules.length === 0) return ["请添加或自动识别字段"];
      return smartRules.map((rule, i) => {
        if (rule.type === "split") return `分列 (第${rule.index}列)`;
        if (rule.type === "between") return `截取 (${rule.start} ... ${rule.end || "行尾"})`;
        return `字段 ${i+1}`;
      });
    }

    if (previewLines.length === 0) return [];
    
    if (mode === "split") {
      const sep = separator === "custom" ? customSeparator : separator;
      if (!sep) return [previewLines[0]];
      const actualSep = sep === "\\t" ? "\t" : sep === "\\n" ? "\n" : sep;
      return previewLines[0].split(actualSep);
    } else {
      // Regex Mode
      if (!regexPattern) return ["等待输入正则..."];
      try {
        const re = new RegExp(regexPattern);
        const match = previewLines[0].match(re);
        if (match && match.length > 1) {
          return match.slice(1); // Return capturing groups
        } else if (match) {
          return [match[0]]; // Return full match if no groups
        }
        return ["无匹配"];
      } catch (e) {
        return ["正则错误"];
      }
    }
  }, [previewLines, mode, separator, customSeparator, regexPattern, smartRules]);

  // Process all data
  const output = useMemo(() => {
    if (!input.trim()) return [];
    
    const processed = input.split("\n")
      .filter(line => line.trim() !== "")
      .map(line => {
        let cols: string[] = [];

        if (mode === "split") {
          const sep = separator === "custom" ? customSeparator : separator;
          const actualSep = sep === "\\t" ? "\t" : sep === "\\n" ? "\n" : sep;
          cols = line.split(actualSep);
        } else if (mode === "regex") {
          try {
            const re = new RegExp(regexPattern);
            const match = line.match(re);
            if (match && match.length > 1) {
              cols = match.slice(1);
            } else if (match) {
              cols = [match[0]];
            } else {
              cols = [];
            }
          } catch {
            cols = [];
          }
        } else if (mode === "smart") {
          cols = smartRules.map(rule => {
            if (rule.type === "split") {
              const sep = separator === "custom" ? customSeparator : separator;
              const actualSep = sep === "\\t" ? "\t" : sep === "\\n" ? "\n" : sep;
              const parts = line.split(actualSep);
              return parts[rule.index - 1] || "";
            } else if (rule.type === "between") {
              if (!rule.start) return "";
              const startIdx = line.indexOf(rule.start);
              if (startIdx === -1) return "";
              const contentStart = startIdx + rule.start.length;
              
              if (!rule.end) {
                return line.substring(contentStart);
              }
              
              const endIdx = line.indexOf(rule.end, contentStart);
              if (endIdx === -1) return line.substring(contentStart);
              return line.substring(contentStart, endIdx);
            }
            return "";
          });
        }
        
        if (cols.length === 0) return "";

        if (useTemplate && outputTemplate) {
          return outputTemplate.replace(/\{(\d+)\}/g, (_, index) => {
            const colIndex = parseInt(index) - 1;
            return cols[colIndex] || "";
          });
        } else {
          // In Smart Mode, we usually want all defined fields joined
          // In Split/Regex, we filter by selectedColumns
          if (mode === "smart") {
             return cols.join(" | ");
          }
          return selectedColumns
            .map(idx => cols[idx])
            .filter(val => val !== undefined)
            .join(mode === "split" ? (separator === "custom" ? customSeparator : separator) : " | ");
        }
      })
      .filter(line => line !== "");

      if (removeDuplicates) {
        return Array.from(new Set(processed));
      }
      return processed;
  }, [input, mode, separator, customSeparator, regexPattern, selectedColumns, outputTemplate, useTemplate, smartRules, removeDuplicates]);

  const toggleColumn = (index: number) => {
    setSelectedColumns(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  const addSmartRule = () => {
    setSmartRules([...smartRules, { type: "between", start: "", end: "" }]);
  };

  const removeSmartRule = (index: number) => {
    setSmartRules(smartRules.filter((_, i) => i !== index));
  };

  const updateSmartRule = (index: number, updates: Partial<SmartRule>) => {
    const newRules = [...smartRules];
    // @ts-ignore - simple update
    newRules[index] = { ...newRules[index], ...updates };
    setSmartRules(newRules);
  };

  const handleExportExcel = () => {
    if (output.length === 0) return;
    
    const data = output.map(line => {
      if (useTemplate) return [line];
      if (mode === "split") {
         const sep = separator === "custom" ? customSeparator : separator;
         const actualSep = sep === "\\t" ? "\t" : sep === "\\n" ? "\n" : sep;
         return line.split(actualSep);
      } else {
         return line.split(" | ");
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "extracted_data.xlsx");
  };

  // Auto-detect separator on paste (simple heuristic)
  useEffect(() => {
    if (!input || mode !== "split") return;
    const firstLine = input.split("\n")[0];
    if (firstLine.includes("|")) setSeparator("|"); // Priority for pipe
    else if (firstLine.includes(":")) setSeparator(":");
    else if (firstLine.includes(",")) setSeparator(",");
    else if (firstLine.includes(";")) setSeparator(";");
    else if (firstLine.includes("\t")) setSeparator("\\t");
  }, [input, mode]);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6">
        <ToolHeader
          title="文本提取工具"
          description="智能文本清洗与提取。支持自定义分隔符、列选择、正则提取，轻松处理日志、Cookie 及各类结构化文本。"
          icon={Split}
        />
        
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Sidebar: Configuration */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-[#0a0a0a]">
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                <Settings2 size={14} className="text-brand" />
                配置选项
              </h2>

              {/* Mode Selection */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">提取模式</label>
                  <div className="flex flex-col border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
                    {[
                      { id: "split", label: "分隔符分列", icon: Split },
                      { id: "smart", label: "智能提取", icon: Wand2 },
                      { id: "regex", label: "正则提取", icon: Regex },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left hover:bg-neutral-50 dark:hover:bg-neutral-900",
                          mode === m.id
                            ? "bg-brand text-white"
                            : "text-neutral-600 dark:text-neutral-400"
                        )}
                      >
                        <m.icon size={14} />
                        <span className="font-mono uppercase text-xs">{m.label}</span>
                        {mode === m.id && <ChevronRight size={14} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-6" />

                {/* Dynamic Settings based on Mode */}
                <div className="space-y-4">
                  {mode === "split" && (
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">分隔符</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "冒号 (:)", value: ":" },
                          { label: "逗号 (,)", value: "," },
                          { label: "竖线 (|)", value: "|" },
                          { label: "分号 (;)", value: ";" },
                          { label: "Tab", value: "\\t" },
                          { label: "空格", value: " " },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSeparator(opt.value)}
                            className={clsx(
                              "px-2 py-2 text-xs border transition-all text-center font-mono",
                              separator === opt.value
                                ? "bg-brand text-white border-brand"
                                : "bg-transparent border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setSeparator("custom")}
                          className={clsx(
                            "col-span-2 px-2 py-2 text-xs border transition-all text-center font-mono uppercase",
                            separator === "custom"
                              ? "bg-brand text-white border-brand"
                              : "bg-transparent border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400"
                          )}
                        >
                          自定义
                        </button>
                      </div>
                      {separator === "custom" && (
                        <input
                          type="text"
                          className="mt-2 w-full p-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none transition-all font-mono"
                          placeholder="输入分隔符..."
                          value={customSeparator}
                          onChange={(e) => setCustomSeparator(e.target.value)}
                        />
                      )}
                    </div>
                  )}

                  {mode === "regex" && (
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">正则表达式</label>
                      <textarea
                        className="w-full p-3 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none font-mono resize-none h-32"
                        placeholder="^([^|]+)\|.*token=([^;]+)"
                        value={regexPattern}
                        onChange={(e) => setRegexPattern(e.target.value)}
                      />
                      <p className="text-[10px] text-neutral-400 mt-2 font-mono">使用 () 捕获组提取字段</p>
                    </div>
                  )}

                  {mode === "smart" && (
                    <div className="space-y-4">
                      <button
                        onClick={addSmartRule}
                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-brand bg-brand/10 hover:bg-brand/20 border border-brand/20 transition-all"
                      >
                        <Plus size={14} />
                        添加规则
                      </button>
                      
                      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {smartRules.map((rule, idx) => (
                          <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-neutral-900 dark:text-white font-mono">字段 {idx + 1}</span>
                              <div className="flex gap-2">
                                <select
                                  className="bg-transparent border-none text-neutral-500 focus:ring-0 p-0 text-xs cursor-pointer font-mono uppercase"
                                  value={rule.type}
                                  onChange={(e) => updateSmartRule(idx, { type: e.target.value as any })}
                                >
                                  <option value="split">按位置</option>
                                  <option value="between">按字符</option>
                                </select>
                                <button onClick={() => removeSmartRule(idx)} className="text-neutral-400 hover:text-red-600">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            
                            {rule.type === "split" ? (
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-neutral-500">列</span>
                                <input
                                  type="number"
                                  className="w-12 p-1 border border-neutral-200 dark:border-neutral-800 text-center bg-white dark:bg-black"
                                  value={rule.index}
                                  onChange={(e) => updateSmartRule(idx, { index: parseInt(e.target.value) || 1 })}
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  className="w-full p-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black font-mono"
                                  placeholder="开始字符 (如: token=)"
                                  value={rule.start}
                                  onChange={(e) => updateSmartRule(idx, { start: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="w-full p-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black font-mono"
                                  placeholder="结束字符 (可选)"
                                  value={rule.end}
                                  onChange={(e) => updateSmartRule(idx, { end: e.target.value })}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-6" />

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">数据处理</label>
                  <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900/50">
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">去除重复项</span>
                    <button
                      onClick={() => setRemoveDuplicates(!removeDuplicates)}
                      className={clsx(
                        "w-9 h-5 rounded-full transition-colors relative",
                        removeDuplicates ? "bg-brand" : "bg-neutral-300 dark:bg-neutral-700"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                        removeDuplicates ? "translate-x-4" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content: Input & Output */}
          <div className="lg:col-span-9 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6 h-[600px]">
              {/* Input Panel */}
              <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white">输入数据</label>
                  <span className="text-xs font-mono text-neutral-500">{input.split('\n').length} 行</span>
                </div>
                <textarea
                  className="flex-1 w-full p-4 bg-transparent resize-none outline-none font-mono text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 custom-scrollbar"
                  placeholder="在此粘贴原始文本数据..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              {/* Output Panel */}
              <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white">提取结果</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(output.join("\n"))}
                      disabled={output.length === 0}
                      className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                      title="复制"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={handleExportExcel}
                      disabled={output.length === 0}
                      className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                      title="导出 Excel"
                    >
                      <FileSpreadsheet size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                  <div className="absolute inset-0 overflow-auto custom-scrollbar p-4">
                    {output.length > 0 ? (
                      <pre className="font-mono text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                        {output.join("\n")}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                        <ArrowRightLeft size={24} className="mb-2 opacity-20" />
                        <p className="text-xs font-mono uppercase">等待输入...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            {input && (
              <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TableIcon size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white">数据预览</h3>
                  </div>
                  
                  {mode !== "smart" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 mr-2 font-mono uppercase">选择列:</span>
                      <div className="flex gap-1">
                        {detectedColumns.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleColumn(idx)}
                            className={clsx(
                              "w-6 h-6 flex items-center justify-center text-xs border transition-colors font-mono",
                              selectedColumns.includes(idx)
                                ? "bg-brand text-white border-brand"
                                : "bg-transparent border-neutral-200 text-neutral-500 hover:border-neutral-400 dark:border-neutral-800"
                            )}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        {detectedColumns.map((col, idx) => (
                          <th key={idx} className="px-6 py-3 font-bold font-mono whitespace-nowrap border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
                            {mode === "smart" ? col : (mode === "split" ? `列 ${idx + 1}` : `组 ${idx + 1}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {previewLines.map((line, rowIdx) => {
                        // Logic to split line for preview
                        let cols: string[] = [];
                        if (mode === "split") {
                            const sep = separator === "custom" ? customSeparator : separator;
                            const actualSep = sep === "\\t" ? "\t" : sep === "\\n" ? "\n" : sep;
                            cols = line.split(actualSep);
                        } else if (mode === "regex") {
                            try {
                                const re = new RegExp(regexPattern);
                                const match = line.match(re);
                                if (match && match.length > 1) cols = match.slice(1);
                                else if (match) cols = [match[0]];
                            } catch { cols = []; }
                        } else if (mode === "smart") {
                            cols = smartRules.map(rule => {
                                if (rule.type === "split") {
                                    const sep = separator === "custom" ? customSeparator : separator;
                                    const actualSep = sep === "\\t" ? "\t" : sep === "\\n" ? "\n" : sep;
                                    return line.split(actualSep)[rule.index - 1] || "";
                                } else if (rule.type === "between") {
                                    if (!rule.start) return "";
                                    const startIdx = line.indexOf(rule.start);
                                    if (startIdx === -1) return "";
                                    const contentStart = startIdx + rule.start.length;
                                    if (!rule.end) return line.substring(contentStart);
                                    const endIdx = line.indexOf(rule.end, contentStart);
                                    return endIdx === -1 ? line.substring(contentStart) : line.substring(contentStart, endIdx);
                                }
                                return "";
                            });
                        }

                        return (
                          <tr key={rowIdx} className="bg-white dark:bg-[#0a0a0a] hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                            {detectedColumns.map((_, colIdx) => (
                              <td key={colIdx} className={clsx(
                                "px-6 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 font-mono text-xs",
                                selectedColumns.includes(colIdx) && mode !== "smart" && "bg-brand/5 font-bold text-brand"
                              )}>
                                {cols[colIdx]}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
