"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools, categories } from "@/config/tools";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  showAutomationOnly?: boolean;
}

export function Sidebar({ showAutomationOnly = false }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter tools based on mode
  const filteredTools = showAutomationOnly 
    ? tools.filter(t => t.isAutomation)
    : tools;

  // Group tools by category
  const toolsByCategory = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="hidden lg:flex flex-col shrink-0 bg-[#fbfbfd]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border-r border-black/5 dark:border-white/10 h-[calc(100vh-3.5rem)] sticky top-14 z-20"
    >
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {Object.keys(categories).map((category) => {
          const categoryTools = toolsByCategory[category];
          if (!categoryTools || categoryTools.length === 0) return null;

          // Group by subcategory if exists
          const subcategories = categoryTools.reduce((acc, tool) => {
            const sub = tool.subcategory || "default";
            if (!acc[sub]) acc[sub] = [];
            acc[sub].push(tool);
            return acc;
          }, {} as Record<string, typeof tools>);

          return (
            <div key={category} className={clsx("mb-6", isCollapsed ? "px-3" : "px-4")}>
              <div className="h-5 mb-2 flex items-center">
                <AnimatePresence mode="wait">
                  {!isCollapsed ? (
                    <motion.h3 
                      key="title"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-2 text-[11px] font-semibold text-[#86868b] uppercase tracking-wide truncate"
                    >
                      {categories[category as keyof typeof categories]}
                    </motion.h3>
                  ) : (
                    <motion.div 
                      key="divider"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-px w-full bg-black/5 dark:bg-white/10 mx-1" 
                    />
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex flex-col gap-1">
                {Object.entries(subcategories).map(([sub, subTools]) => (
                  <div key={sub} className="space-y-1">
                    <AnimatePresence>
                      {sub !== "default" && !isCollapsed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-2 py-1 text-[10px] font-medium text-[#86868b] uppercase tracking-wider mt-2"
                        >
                          {sub}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {subTools.map((tool) => {
                      const isActive = pathname === tool.href;
                      return (
                        <Link
                          key={tool.id}
                          href={tool.href}
                          title={isCollapsed ? tool.name : undefined}
                          className={clsx(
                            "group flex items-center transition-all rounded-md relative",
                            isCollapsed 
                              ? "justify-center w-10 h-10 mx-auto" 
                              : "gap-3 px-3 py-1.5 text-[13px]",
                            isActive
                              ? "bg-[#0071e3] text-white shadow-sm font-medium"
                              : "text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10"
                          )}
                        >
                          <tool.icon 
                            size={isCollapsed ? 20 : 16} 
                            strokeWidth={2} 
                            className={clsx(
                              "shrink-0 transition-colors",
                              isActive 
                                ? "text-white" 
                                : "text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-[#f5f5f7]"
                            )} 
                          />
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="whitespace-nowrap"
                              >
                                {tool.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Toggle Button */}
      <div className="p-4 border-t border-black/5 dark:border-white/10 bg-[#fbfbfd]/50 dark:bg-[#1e1e1e]/50 backdrop-blur-md">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            "flex items-center rounded-md transition-colors text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
            isCollapsed ? "justify-center w-10 h-10 mx-auto" : "w-full px-3 py-2 gap-3"
          )}
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? <PanelLeftOpen size={20} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
              >
                收起侧边栏
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
