"use client";

import { ToolHeader } from "@/components/ToolHeader";
import { Fingerprint, Shield, Zap, Globe, Users, Lock } from "lucide-react";
import Link from "next/link";

export default function MoreLoginPage() {
  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8">
      <ToolHeader
        title="MoreLogin 指纹浏览器"
        description="专业的指纹浏览器，多账号防关联管理神器。提供真实指纹环境，安全高效。"
        icon={Fingerprint}
      />

      {/* Hero Section */}
      <div className="grid md:grid-cols-2 gap-12 items-center bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
            多账号安全管理<br />
            <span className="text-brand">从 MoreLogin 开始</span>
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            MoreLogin 是一款专为跨境电商、社媒营销、联盟营销等场景设计的指纹浏览器。它通过模拟真实的浏览器指纹环境，帮助用户在同一台设备上安全地管理多个账号，有效防止账号关联和封禁。
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
              <Shield size={16} className="text-green-500" />
              <span>防关联封号</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
              <Zap size={16} className="text-yellow-500" />
              <span>高效团队协作</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
              <Globe size={16} className="text-blue-500" />
              <span>真实指纹环境</span>
            </div>
          </div>
          
          <div className="pt-2">
            <Link
              href="https://www.morelogin.com/register/?from=MID888"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              免费注册使用
              <Globe size={18} />
            </Link>
          </div>
        </div>
        <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-200 dark:border-neutral-700 p-12">
          <img 
            src="/morelogin/logo-white-bg.png" 
            alt="MoreLogin Logo" 
            className="dark:hidden w-full h-full object-contain" 
          />
          <img 
            src="/morelogin/logo-black-bg.png" 
            alt="MoreLogin Logo" 
            className="hidden dark:block w-full h-full object-contain" 
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
            <Fingerprint className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2">真实指纹模拟</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            基于真实设备指纹数据库，模拟 Canvas、WebGL、Audio 等多种硬件指纹，通过任何网站的检测。
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
            <Users className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2">团队高效协作</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            支持多成员权限管理，灵活分配账号与环境，实时同步操作数据，提升团队工作效率。
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
            <Lock className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2">数据安全加密</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            采用云端加密存储技术，保障账号数据安全。支持本地存储模式，数据完全掌握在自己手中。
          </p>
        </div>
      </div>
    </div>
  );
}
