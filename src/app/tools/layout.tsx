import { Sidebar } from "@/components/Sidebar";

export const dynamic = 'force-dynamic';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isStandalone = process.env.APP_MODE === 'standalone';

  return (
    <div className="w-full px-6 min-h-screen">
      <div className="flex">
        <Sidebar showAutomationOnly={isStandalone} />
        <main className="flex-1 min-w-0">
          {isStandalone && (
             <div className="mb-4 px-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  本地运行模式
                </span>
             </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
