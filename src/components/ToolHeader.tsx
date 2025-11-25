import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface ToolHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function ToolHeader({ title, description, icon: Icon, action }: ToolHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b pb-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
          {description}
        </p>
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
