import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "MID - 你的全能工具箱",
  description: "汇集各种实用的在线工具，提高你的工作效率。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`antialiased min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-neutral-200 dark:border-neutral-800 py-12 bg-neutral-50 dark:bg-[#0a0a0a]">
            <div className="w-full px-6 flex justify-between items-center text-xs text-neutral-500 font-mono">
              <p>© {new Date().getFullYear()} MID.TOOLS</p>
              <p>为效率而设计</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
