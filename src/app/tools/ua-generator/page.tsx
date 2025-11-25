"use client";

import { useState } from "react";
import { Monitor, Smartphone, RefreshCw, Copy, Download, Trash2, Settings2, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { ToolHeader } from "@/components/ToolHeader";

export default function UAGenerator() {
  const [count, setCount] = useState(10);
  const [os, setOs] = useState<string[]>(["windows", "mac"]);
  const [browsers, setBrowsers] = useState<string[]>(["chrome"]);
  const [results, setResults] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Version control
  const [chromeMin, setChromeMin] = useState(100);
  const [chromeMax, setChromeMax] = useState(124);
  const [firefoxMin, setFirefoxMin] = useState(100);
  const [firefoxMax, setFirefoxMax] = useState(125);

  const osOptions = [
    { id: "windows", label: "Windows", icon: Monitor },
    { id: "mac", label: "macOS", icon: Monitor },
    { id: "linux", label: "Linux", icon: Monitor },
    { id: "android", label: "Android", icon: Smartphone },
    { id: "ios", label: "iOS", icon: Smartphone },
  ];

  const browserOptions = [
    { id: "chrome", label: "Chrome" },
    { id: "firefox", label: "Firefox" },
    { id: "safari", label: "Safari" },
    { id: "edge", label: "Edge" },
  ];

  const getRandomVersion = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateUAs = () => {
    const newUAs: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Pick random OS and Browser from selected
      const selectedOs = os.length > 0 ? os[Math.floor(Math.random() * os.length)] : "windows";
      const selectedBrowser = browsers.length > 0 ? browsers[Math.floor(Math.random() * browsers.length)] : "chrome";
      
      let ua = "";
      
      // OS Part
      let osPart = "";
      if (selectedOs === "windows") osPart = `Windows NT 10.0; Win64; x64`;
      else if (selectedOs === "mac") osPart = `Macintosh; Intel Mac OS X 10_15_7`;
      else if (selectedOs === "linux") osPart = `X11; Linux x86_64`;
      else if (selectedOs === "android") osPart = `Linux; Android 10; K`;
      else if (selectedOs === "ios") osPart = `iPhone; CPU iPhone OS 17_1 like Mac OS X`;

      // Browser Part
      if (selectedBrowser === "chrome") {
        const major = getRandomVersion(chromeMin, chromeMax);
        const minor = getRandomVersion(0, 5000);
        const build = getRandomVersion(0, 200);
        ua = `Mozilla/5.0 (${osPart}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.${minor}.${build} Safari/537.36`;
      } else if (selectedBrowser === "firefox") {
        const major = getRandomVersion(firefoxMin, firefoxMax);
        const minor = getRandomVersion(0, 10);
        ua = `Mozilla/5.0 (${osPart}; rv:${major}.${minor}) Gecko/20100101 Firefox/${major}.${minor}`;
      } else if (selectedBrowser === "safari") {
        const v = ["17.2", "17.1", "16.6", "16.5", "15.6"][Math.floor(Math.random() * 5)];
        if (selectedOs === "ios" || selectedOs === "mac") {
             ua = `Mozilla/5.0 (${osPart}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v} Safari/605.1.15`;
        } else {
             // Fallback for non-apple safari (rare but just in case)
             const major = getRandomVersion(chromeMin, chromeMax);
             ua = `Mozilla/5.0 (${osPart}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`;
        }
      } else if (selectedBrowser === "edge") {
        const major = getRandomVersion(chromeMin, chromeMax); // Edge follows Chromium versions roughly
        const minor = getRandomVersion(0, 5000);
        const build = getRandomVersion(0, 200);
        ua = `Mozilla/5.0 (${osPart}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.${minor}.${build} Safari/537.36 Edg/${major}.0.${minor}.${build}`;
      }

      newUAs.push(ua);
    }
    setResults(newUAs);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const exportExcel = () => {
    if (results.length === 0) return;
    const data = results.map((ua, idx) => ({
      "ID": idx + 1,
      "User-Agent": ua
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "UserAgents");
    XLSX.writeFile(wb, `user_agents_${new Date().getTime()}.xlsx`);
  };

  const toggleSelection = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      if (list.length > 1) setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="User-Agent 生成"
        description="批量生成不同平台和浏览器的 User-Agent 字符串。"
        icon={Monitor}
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

              <div>
                <label className="text-sm font-medium block mb-3">操作系统</label>
                <div className="grid grid-cols-2 gap-2">
                  {osOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggleSelection(os, setOs, opt.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                        os.includes(opt.id)
                          ? "bg-brand/10 border-brand text-brand"
                          : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      <opt.icon size={14} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-3">浏览器</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {browserOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggleSelection(browsers, setBrowsers, opt.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                        browsers.includes(opt.id)
                          ? "bg-brand/10 border-brand text-brand"
                          : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Version Controls */}
                {(browsers.includes("chrome") || browsers.includes("edge")) && (
                  <div className="space-y-2 mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <label className="text-xs font-medium text-neutral-500">Chrome/Edge 版本范围</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={chromeMin}
                        onChange={(e) => setChromeMin(Number(e.target.value))}
                        className="w-full p-1 text-sm border rounded bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                        placeholder="Min"
                      />
                      <span className="text-neutral-400">-</span>
                      <input 
                        type="number" 
                        value={chromeMax}
                        onChange={(e) => setChromeMax(Number(e.target.value))}
                        className="w-full p-1 text-sm border rounded bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                )}

                {browsers.includes("firefox") && (
                  <div className="space-y-2 mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <label className="text-xs font-medium text-neutral-500">Firefox 版本范围</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={firefoxMin}
                        onChange={(e) => setFirefoxMin(Number(e.target.value))}
                        className="w-full p-1 text-sm border rounded bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                        placeholder="Min"
                      />
                      <span className="text-neutral-400">-</span>
                      <input 
                        type="number" 
                        value={firefoxMax}
                        onChange={(e) => setFirefoxMax(Number(e.target.value))}
                        className="w-full p-1 text-sm border rounded bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={generateUAs}
                className="w-full py-3 bg-brand text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                生成 UA
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
                  {results.length} 个
                </span>
              </div>
              <div className="flex gap-2">
                {results.length > 0 && (
                  <>
                    <button
                      onClick={exportExcel}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Download size={14} />
                      导出 Excel
                    </button>
                    <button
                      onClick={() => setResults([])}
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
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                  <Monitor size={48} className="mb-4 opacity-20" />
                  <p>点击左侧按钮生成 User-Agent</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((ua, idx) => (
                    <div
                      key={idx}
                      className="group relative p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-brand/50 transition-colors"
                    >
                      <div className="font-mono text-xs break-all pr-8 leading-relaxed text-neutral-600 dark:text-neutral-300">{ua}</div>
                      <button
                        onClick={() => copyToClipboard(ua, idx)}
                        className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-brand hover:bg-white dark:hover:bg-neutral-800 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="复制"
                      >
                        {copiedIndex === idx ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
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
