"use client";

import { useState } from "react";
import { Key, RefreshCw, Copy, Download, Trash2, Settings2, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import clsx from "clsx";
import { ToolHeader } from "@/components/ToolHeader";

export default function PasswordGenerator() {
  const [length, setLength] = useState(12);
  const [count, setCount] = useState(10);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generatePasswords = () => {
    const charset = {
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lower: "abcdefghijklmnopqrstuvwxyz",
      number: "0123456789",
      symbol: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
    };

    let chars = "";
    if (options.uppercase) chars += charset.upper;
    if (options.lowercase) chars += charset.lower;
    if (options.numbers) chars += charset.number;
    if (options.symbols) chars += charset.symbol;

    if (options.excludeSimilar) {
      chars = chars.replace(/[il1Lo0O]/g, "");
    }

    if (chars === "") return;

    const newPasswords = [];
    for (let i = 0; i < count; i++) {
      let password = "";
      const array = new Uint32Array(length);
      crypto.getRandomValues(array);
      for (let j = 0; j < length; j++) {
        password += chars[array[j] % chars.length];
      }
      newPasswords.push(password);
    }
    setPasswords(newPasswords);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const exportExcel = () => {
    if (passwords.length === 0) return;
    const data = passwords.map((pwd, idx) => ({
      "ID": idx + 1,
      "密码": pwd,
      "长度": length
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Passwords");
    XLSX.writeFile(wb, `passwords_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="强密码生成器"
        description="生成高强度随机密码。支持自定义长度、字符集（大小写/数字/符号）及批量生成导出。"
        icon={Key}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Panel */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings2 size={20} />
              生成设置
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">密码长度</label>
                  <span className="text-sm font-mono bg-neutral-100 dark:bg-neutral-800 px-2 rounded">{length}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full accent-brand"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">生成数量</label>
                  <span className="text-sm font-mono bg-neutral-100 dark:bg-neutral-800 px-2 rounded">{count}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full accent-brand"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium block">字符选项</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "uppercase", label: "大写字母 (A-Z)" },
                    { key: "lowercase", label: "小写字母 (a-z)" },
                    { key: "numbers", label: "数字 (0-9)" },
                    { key: "symbols", label: "特殊符号 (!@#)" },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={options[opt.key as keyof typeof options]}
                        onChange={() => setOptions({ ...options, [opt.key]: !options[opt.key as keyof typeof options] })}
                        className="rounded border-neutral-300 text-brand focus:ring-brand"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <input
                    type="checkbox"
                    checked={options.excludeSimilar}
                    onChange={() => setOptions({ ...options, excludeSimilar: !options.excludeSimilar })}
                    className="rounded border-neutral-300 text-brand focus:ring-brand"
                  />
                  排除易混淆字符 (i, l, 1, L, o, 0, O)
                </label>
              </div>

              <button
                onClick={generatePasswords}
                className="w-full py-3 bg-brand text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                生成密码
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="w-full md:w-2/3">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="font-bold">生成结果</h2>
                <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-500">
                  {passwords.length} 个
                </span>
              </div>
              <div className="flex gap-2">
                {passwords.length > 0 && (
                  <>
                    <button
                      onClick={exportExcel}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Download size={14} />
                      导出 Excel
                    </button>
                    <button
                      onClick={() => setPasswords([])}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-red-500"
                    >
                      <Trash2 size={14} />
                      清空
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {passwords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                  <Key size={48} className="mb-4 opacity-20" />
                  <p>点击左侧按钮生成密码</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {passwords.map((pwd, idx) => (
                    <div
                      key={idx}
                      className="group relative flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-brand/50 transition-colors"
                    >
                      <div className="font-mono text-sm break-all mr-8">{pwd}</div>
                      <button
                        onClick={() => copyToClipboard(pwd, idx)}
                        className="absolute right-3 p-1.5 text-neutral-400 hover:text-brand hover:bg-white dark:hover:bg-neutral-800 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="复制"
                      >
                        {copiedIndex === idx ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
