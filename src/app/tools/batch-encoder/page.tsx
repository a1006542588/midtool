"use client";

import { useState } from "react";
import { Code2, Copy, Download, Trash2, ArrowRightLeft, Hash, Binary } from "lucide-react";
import * as XLSX from "xlsx";
import clsx from "clsx";
import CryptoJS from "crypto-js";
import { ToolHeader } from "@/components/ToolHeader";

export default function BatchEncoder() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode" | "hash">("encode");
  const [method, setMethod] = useState<"base64" | "url" | "hex" | "md5" | "sha1" | "sha256">("base64");
  
  const process = () => {
    if (!input) return "";
    const lines = input.split("\n");
    
    return lines.map(line => {
        if (!line) return "";
        try {
            if (mode === "hash") {
                if (method === "md5") return CryptoJS.MD5(line).toString();
                if (method === "sha1") return CryptoJS.SHA1(line).toString();
                if (method === "sha256") return CryptoJS.SHA256(line).toString();
                return line;
            }

            if (mode === "encode") {
                if (method === "base64") return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(line));
                if (method === "url") return encodeURIComponent(line);
                if (method === "hex") return CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(line));
            } else {
                // Decode
                if (method === "base64") return CryptoJS.enc.Base64.parse(line).toString(CryptoJS.enc.Utf8);
                if (method === "url") return decodeURIComponent(line);
                if (method === "hex") return CryptoJS.enc.Hex.parse(line).toString(CryptoJS.enc.Utf8);
            }
            return line;
        } catch (e) {
            return `Error: ${line}`;
        }
    }).join("\n");
  };

  const output = process();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const exportExcel = () => {
    if (!output) return;
    const lines = output.split("\n");
    const data = lines.map((line, i) => ({ 
        "Input": input.split("\n")[i] || "",
        "Output": line 
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Encoded Data");
    XLSX.writeFile(wb, `batch_${mode}_${method}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="批量编码加密"
        description="支持 Base64、URL、Hex 编码转换，以及 MD5、SHA 等哈希计算。"
        icon={Binary}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        {/* Input */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="font-medium text-sm">输入数据</label>
            <button onClick={() => setInput("")} className="text-neutral-400 hover:text-red-500">
                <Trash2 size={16} />
            </button>
          </div>
          <textarea
            className="flex-1 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 resize-none font-mono text-xs focus:ring-2 focus:ring-brand outline-none"
            placeholder="每行一个数据..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 flex flex-col justify-center gap-6">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">操作模式</label>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => { setMode("encode"); if(["md5","sha1","sha256"].includes(method)) setMethod("base64"); }}
                            className={clsx(
                                "px-3 py-2 text-sm rounded-lg border transition-all flex items-center gap-2",
                                mode === "encode" ? "bg-brand/10 border-brand text-brand" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            )}
                        >
                            <ArrowRightLeft size={14} /> 编码 (Encode)
                        </button>
                        <button
                            onClick={() => { setMode("decode"); if(["md5","sha1","sha256"].includes(method)) setMethod("base64"); }}
                            className={clsx(
                                "px-3 py-2 text-sm rounded-lg border transition-all flex items-center gap-2",
                                mode === "decode" ? "bg-brand/10 border-brand text-brand" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            )}
                        >
                            <ArrowRightLeft size={14} /> 解码 (Decode)
                        </button>
                        <button
                            onClick={() => { setMode("hash"); setMethod("md5"); }}
                            className={clsx(
                                "px-3 py-2 text-sm rounded-lg border transition-all flex items-center gap-2",
                                mode === "hash" ? "bg-brand/10 border-brand text-brand" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            )}
                        >
                            <Hash size={14} /> 哈希 (Hash)
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">算法选择</label>
                    <div className="grid grid-cols-1 gap-2">
                        {mode === "hash" ? (
                            <>
                                {["md5", "sha1", "sha256"].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMethod(m as any)}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs rounded border transition-all uppercase",
                                            method === m ? "bg-neutral-800 text-white border-neutral-800" : "border-neutral-200 hover:bg-neutral-50"
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <>
                                {["base64", "url", "hex"].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMethod(m as any)}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs rounded border transition-all uppercase",
                                            method === m ? "bg-neutral-800 text-white border-neutral-800" : "border-neutral-200 hover:bg-neutral-50"
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="font-medium text-sm">处理结果</label>
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                disabled={!output}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
              >
                <Download size={14} /> Excel
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!output}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
              >
                <Copy size={14} /> 复制
              </button>
            </div>
          </div>
          <textarea
            readOnly
            className="flex-1 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 resize-none font-mono text-xs focus:ring-2 focus:ring-brand outline-none"
            value={output}
            placeholder="结果将显示在这里..."
          />
        </div>
      </div>
    </div>
  );
}
