"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { tools, categories } from "@/config/tools";
import { ArrowRight, LayoutGrid, ChevronRight, ShoppingCart, ShieldCheck, ExternalLink, Box } from "lucide-react";
import clsx from "clsx";
import { FadeIn } from "@/components/FadeIn";

interface HomeClientProps {
  isStandalone?: boolean;
}

function ToolGrid({ isStandalone }: { isStandalone?: boolean }) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  // If standalone, we only show automation tools and a simplified view
  if (isStandalone) {
    const automationTools = tools.filter(t => t.isAutomation);
    
    return (
      <FadeIn direction="none" duration={0.5} fullWidth>
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-[#1c1c1e] p-8 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  自动化运行终端
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  本地独立运行模式，数据更安全，操作更便捷。
                </p>
              </div>
              
              <div className="flex gap-4">
                <a 
                  href="https://mid.midaccs.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-medium hover:bg-brand/90 transition-colors shadow-sm"
                >
                  <ShoppingCart size={18} />
                  <span>跳转到账号商城</span>
                </a>
                <a 
                  href="https://tools.midaccs.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Box size={18} />
                  <span>跳转到在线工具箱</span>
                </a>
              </div>
            </div>

            {/* Tools Grid */}
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <LayoutGrid size={20} className="text-brand" />
                可用自动化工具
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {automationTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  // ... Existing Logic for Full Toolbox ...
  // Filter tools based on search query
  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered tools by category
  const toolsByCategory = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  const categoryKeys = Object.keys(categories) as Array<keyof typeof categories>;

  // Helper to render content for a category
  const renderCategoryContent = (catKey: string, catTools: typeof tools) => {
    // If we are in a specific subcategory view, filter tools
    if (activeSubcategory) {
      const subTools = catTools.filter(t => t.subcategory === activeSubcategory);
      if (subTools.length === 0) return null;

      return (
        <div className="space-y-4">
          <button 
            onClick={() => setActiveSubcategory(null)}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand mb-4"
          >
            <ArrowRight className="rotate-180" size={16} />
            返回上级
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {subTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      );
    }

    // Group by subcategory
    const subcategories = catTools.reduce((acc, tool) => {
      const sub = tool.subcategory || "default";
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(tool);
      return acc;
    }, {} as Record<string, typeof tools>);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Render Subcategory Cards first */}
        {Object.entries(subcategories).map(([sub, subTools]) => {
          if (sub !== "default") {
            // Use the first tool's icon for the subcategory card
            const Icon = subTools[0].icon;
            return (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(sub)}
                className="group flex flex-col bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-brand dark:hover:border-brand hover:shadow-md transition-all duration-200 h-full text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-brand/10 rounded-lg text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full">
                    {subTools.length} 个工具
                  </span>
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1.5 group-hover:text-brand transition-colors">
                  {sub}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                  包含 {subTools.map(t => t.name).join("、")} 等工具
                </p>
              </button>
            );
          }
          return null;
        })}

        {/* Render Standalone Tools */}
        {subcategories["default"]?.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    );
  };

  return (
    <FadeIn direction="none" duration={0.5} fullWidth>
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a]">
        {/* Top Banner / Hero */}
        <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-full px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              
              {/* Left: Title & Intro */}
              <div className="max-w-3xl space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                    MID账号工厂 - 便捷工具箱
                  </h1>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-base">
                    专为跨境电商、社媒营销、Web3 玩家打造的高效工具集合。
                    <br />
                    我们承诺：所有工具均为纯前端运行或无日志后端，<span className="text-brand font-medium">绝不保存您的任何敏感数据</span>（如私钥、Cookie、账号密码等）。安全、免费、即开即用。
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <a 
                    href="https://mid.midaccs.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors shadow-sm"
                  >
                    <ShoppingCart size={18} />
                    <span>访问账号商城</span>
                  </a>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span>数据安全保护中</span>
                  </div>
                </div>
              </div>

              {/* Right: Changelog */}
              <div className="w-full md:w-80 shrink-0">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                    更新日志
                  </h3>
                  <ul className="space-y-3">
                    <li className="text-sm text-neutral-600 dark:text-neutral-400 flex gap-3">
                      <span className="font-mono text-xs text-neutral-400 shrink-0 mt-0.5">11-22</span>
                      <span className="leading-snug">新增指纹浏览器分类及 MoreLogin 工具，优化首页导航体验。</span>
                    </li>
                    <li className="text-sm text-neutral-600 dark:text-neutral-400 flex gap-3">
                      <span className="font-mono text-xs text-neutral-400 shrink-0 mt-0.5">11-21</span>
                      <span className="leading-snug">全新首页上线，新增工具分类导航。</span>
                    </li>
                    <li className="text-sm text-neutral-600 dark:text-neutral-400 flex gap-3">
                      <span className="font-mono text-xs text-neutral-400 shrink-0 mt-0.5">11-20</span>
                      <span className="leading-snug">优化代理检测工具，支持 SOCKS5 远程 DNS。</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="w-full px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Sidebar: Categories */}
            <div className="w-full lg:w-64 shrink-0 space-y-2">
              <button
                onClick={() => { setActiveCategory("all"); setActiveSubcategory(null); }}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                  activeCategory === "all"
                    ? "bg-[#0071e3] text-white shadow-sm"
                    : "text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid size={18} />
                  <span>全部工具</span>
                </div>
                {activeCategory === "all" && <ChevronRight size={14} />}
              </button>

              <div className="h-px bg-black/5 dark:bg-white/10 my-3 mx-4" />

              {categoryKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => { setActiveCategory(key); setActiveSubcategory(null); }}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                    activeCategory === key
                      ? "bg-white dark:bg-[#1c1c1e] text-[#0071e3] dark:text-[#2997ff] shadow-sm"
                      : "text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10"
                  )}
                >
                  <span>{categories[key]}</span>
                  <span className="text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-[#86868b]">
                    {tools.filter(t => t.category === key).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Content: Tool Grid */}
            <div className="flex-1">
              {activeCategory === "all" ? (
                // Show All Categories
                <div className="space-y-10">
                  {categoryKeys.map((catKey) => {
                    const catTools = toolsByCategory[catKey];
                    if (!catTools || catTools.length === 0) return null;
                    
                    return (
                      <section key={catKey}>
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {categories[catKey]}
                          </h2>
                          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                        {renderCategoryContent(catKey, catTools)}
                      </section>
                    );
                  })}
                </div>
              ) : (
                // Show Single Category
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                      {categories[activeCategory as keyof typeof categories]}
                    </h2>
                    <span className="text-sm text-neutral-500">
                      共 {tools.filter(t => t.category === activeCategory).length} 个工具
                    </span>
                  </div>
                  {renderCategoryContent(activeCategory, toolsByCategory[activeCategory] || [])}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function ToolCard({ tool }: { tool: any }) {
  return (
    <FadeIn fullWidth>
      <Link
        href={tool.href}
        className="group flex flex-col bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 h-full border border-transparent dark:border-white/5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 bg-[#0071e3]/10 dark:bg-[#2997ff]/10 rounded-xl text-[#0071e3] dark:text-[#2997ff] group-hover:bg-[#0071e3] group-hover:text-white transition-colors duration-300">
            <tool.icon size={22} strokeWidth={2} />
          </div>
          {tool.subcategory && (
            <span className="text-[10px] font-semibold px-2 py-1 bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#86868b] rounded-full">
              {tool.subcategory}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1.5 text-[15px] tracking-tight">
          {tool.name}
        </h3>
        <p className="text-[13px] text-[#86868b] leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </Link>
    </FadeIn>
  );
}

export default function HomeClient({ isStandalone }: HomeClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ToolGrid isStandalone={isStandalone} />
    </Suspense>
  );
}
