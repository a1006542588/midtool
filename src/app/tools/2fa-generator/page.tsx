"use client";

import { useState, useEffect } from "react";
import * as OTPAuth from "otpauth";
import * as XLSX from "xlsx";
import { Download, ShieldCheck } from "lucide-react";
import { ToolHeader } from "@/components/ToolHeader";

interface OTPItem {
  secret: string;
  code: string;
  timeLeft: number;
  label?: string;
}

export default function TwoFAGenerator() {
  const [input, setInput] = useState("");
  const [otpList, setOtpList] = useState<OTPItem[]>([]);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const exportExcel = () => {
    if (otpList.length === 0) return;
    
    const data = otpList.map(item => ({
      "备注": item.label,
      "密钥": item.secret,
      "当前验证码": item.code,
      "剩余时间(秒)": item.timeLeft
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "2FA Codes");
    XLSX.writeFile(wb, `2fa_codes_${new Date().getTime()}.xlsx`);
  };

  // Parse input and generate OTPs
  const generateOTPs = () => {
    setError("");
    const lines = input.split("\n").filter((line) => line.trim() !== "");
    const newOtpList: OTPItem[] = [];

    lines.forEach((line) => {
      // Try to handle "Label: Secret" or just "Secret" format
      let secret = line.trim();
      let label = "Unknown";

      // Simple heuristic: if there's a separator like space, tab, comma, or colon
      // we assume the last part is the secret (usually secrets are long alphanumeric strings)
      // But user requirement says "Show which key the code belongs to".
      // Let's assume the user might paste just secrets, or "Label Secret".
      
      // Let's try to detect if the line has a separator
      const parts = line.split(/[\s,:]+/);
      if (parts.length > 1) {
          // Assume the last part is the secret if it looks like a base32 string (roughly)
          // Or just take the last part as secret and the rest as label
          secret = parts[parts.length - 1];
          label = parts.slice(0, parts.length - 1).join(" ");
      } else {
          label = `Key ${secret.substring(0, 4)}...`;
      }

      // Clean secret (remove spaces)
      secret = secret.replace(/\s/g, "");

      try {
        const totp = new OTPAuth.TOTP({
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret),
        });

        const code = totp.generate();
        // Calculate time left in current period
        const period = 30;
        const epoch = Math.round(new Date().getTime() / 1000.0);
        const timeLeft = period - (epoch % period);

        newOtpList.push({
          secret,
          code,
          timeLeft,
          label,
        });
      } catch (e) {
        console.error("Invalid secret:", secret, e);
        // We might want to show an error or just skip invalid ones
        // For now, let's just skip or add a placeholder? 
        // Let's add it but mark as invalid in UI if needed, or just skip.
        // Skipping is safer to avoid crashing the loop.
      }
    });

    if (newOtpList.length === 0 && lines.length > 0) {
        setError("无法解析有效的 2FA 密钥，请检查格式 (Base32)。");
    }

    setOtpList(newOtpList);
  };

  // Update codes every second
  useEffect(() => {
    if (otpList.length === 0) return;

    const interval = setInterval(() => {
      setOtpList((currentList) => {
        return currentList.map((item) => {
          try {
            const totp = new OTPAuth.TOTP({
              algorithm: "SHA1",
              digits: 6,
              period: 30,
              secret: OTPAuth.Secret.fromBase32(item.secret),
            });
            
            const period = 30;
            const epoch = Math.round(new Date().getTime() / 1000.0);
            const timeLeft = period - (epoch % period);
            
            return {
              ...item,
              code: totp.generate(),
              timeLeft,
            };
          } catch (e) {
            return item;
          }
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpList.length]); // Re-run effect if list length changes (e.g. cleared or added)

  const copyToClipboard = (text: string, index: number) => {
    // Try modern API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 1500);
        })
        .catch((err) => {
          console.warn("Clipboard API failed, trying fallback...", err);
          fallbackCopy(text, index);
        });
    } else {
      fallbackCopy(text, index);
    }
  };

  const fallbackCopy = (text: string, index: number) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Avoid scrolling to bottom
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <ToolHeader
        title="2FA 动态码生成"
        description="批量导入 2FA 密钥，实时生成动态验证码。支持备注区分，点击一键复制。"
        icon={ShieldCheck}
      />

      <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800">
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            输入密钥 (每行一个，支持 "备注 密钥" 格式)
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 p-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="JBSWY3DPEHPK3PXP&#10;Google: JBSWY3DPEHPK3PXP"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateOTPs}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            生成验证码
          </button>
          <button
            onClick={() => {
                setInput("");
                setOtpList([]);
                setError("");
            }}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            清空
          </button>
          {otpList.length > 0 && (
            <button
              onClick={exportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              导出 Excel
            </button>
          )}
        </div>

        {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                {error}
            </div>
        )}
      </div>

      {otpList.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-md font-semibold mb-4 flex justify-between items-center text-neutral-900 dark:text-neutral-100">
            <span>生成结果 ({otpList.length})</span>
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">点击验证码复制</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otpList.map((item, idx) => (
              <div 
                key={idx} 
                className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-neutral-50 dark:bg-neutral-800/50"
              >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 truncate w-2/3" title={item.label}>
                        {item.label}
                    </span>
                    <div className="flex items-center text-xs text-neutral-400 dark:text-neutral-500" title="刷新倒计时">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.timeLeft}s
                    </div>
                </div>
                
                <div 
                    onClick={() => copyToClipboard(item.code, idx)}
                    className={`text-2xl font-mono font-bold cursor-pointer text-center py-2 bg-white dark:bg-neutral-800 rounded border border-neutral-100 dark:border-neutral-700 select-none transition-colors ${
                      copiedIndex === idx ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    }`}
                    title="点击复制"
                >
                    {copiedIndex === idx ? (
                      <span className="text-lg">已复制</span>
                    ) : (
                      <>{item.code.slice(0, 3)} {item.code.slice(3)}</>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
