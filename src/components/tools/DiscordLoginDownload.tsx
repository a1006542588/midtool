"use client";

import { ToolHeader } from "@/components/ToolHeader";
import { Bot, Download, ShieldAlert, Terminal } from "lucide-react";

export function DiscordLoginDownload() {
  return (
    <div className="w-full px-4 space-y-6">
      <ToolHeader
        title="Discord 自动登录"
        description="使用 MoreLogin 指纹浏览器自动登录 Discord。"
        icon={Bot}
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
        {/* Download Card */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 shadow-sm border border-black/5 dark:border-white/10 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto text-[#0071e3]">
            <Download className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">下载本地版工具</h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
              由于浏览器自动化操作需要访问您本地的 MoreLogin 环境 (127.0.0.1)，
              请下载此工具的本地运行版本。
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <a 
              href="/downloads/discord-login-tool.zip" 
              download
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              <Download className="w-5 h-5" />
              下载工具包 (v1.0.0)
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 shadow-sm border border-black/5 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            使用说明
          </h3>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-400 shrink-0">
                1
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">解压文件</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  下载压缩包后，将其解压到您电脑上的任意文件夹（建议路径不包含中文）。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-400 shrink-0">
                2
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">启动 MoreLogin</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  确保 MoreLogin 指纹浏览器已启动并登录。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-400 shrink-0">
                3
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">运行工具</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  双击运行文件夹中的 <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono">start.bat</code> (Windows) 或 <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono">start.sh</code> (Mac)。
                  浏览器将自动打开工具界面。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-100 dark:border-yellow-900/20 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">为什么需要下载本地版？</p>
            <p className="opacity-90">
              此工具需要控制您本地电脑上的 MoreLogin 浏览器窗口。出于安全限制，网页版无法直接访问您本地的应用程序接口 (Localhost API)。
              本地版运行在您的电脑上，可以安全、快速地与 MoreLogin 进行通信。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}