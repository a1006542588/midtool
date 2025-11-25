"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Command } from "lucide-react";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    
    // If not on homepage, redirect to homepage with query
    if (pathname !== "/") {
        replace(`/?${params.toString()}`);
    } else {
        replace(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="relative max-w-md w-full hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
      <input
        type="text"
        className="w-full pl-9 pr-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-900 border focus:border-brand outline-none transition-all text-sm"
        placeholder="搜索工具..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("q")?.toString()}
      />
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl saturate-150">
      <div className="w-full px-6 h-14 flex items-center justify-between gap-8">
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="MID Tools" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">MID Tools</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium">
            <Link href="/" className="text-[#1d1d1f]/80 hover:text-[#0071e3] dark:text-[#f5f5f7]/80 dark:hover:text-[#2997ff] transition-colors">
              首页
            </Link>
            <a href="https://mid.midaccs.com/" target="_blank" rel="noopener noreferrer" className="text-[#1d1d1f]/80 hover:text-[#0071e3] dark:text-[#f5f5f7]/80 dark:hover:text-[#2997ff] transition-colors">
              账号商城
            </a>
          </nav>
        </div>

        <div className="flex-1 flex justify-center">
            <Suspense fallback={<div className="w-full max-w-md h-9 bg-[#f5f5f7] rounded-lg animate-pulse" />}>
                <SearchBar />
            </Suspense>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <ThemeToggle />
          <button className="px-4 py-1.5 bg-[#0071e3] text-white rounded-full text-[13px] font-medium hover:bg-[#0077ED] transition-colors shadow-sm">
            登录
          </button>
        </div>
      </div>
    </header>
  );
}
