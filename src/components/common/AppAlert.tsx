import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AlertTone = "info" | "success" | "warning" | "danger";

const toneStyles: Record<AlertTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100",
  danger:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100",
};

const icons: Record<AlertTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

export function AppAlert({
  title,
  description,
  tone = "info",
  action,
  onDismiss,
  className,
}: {
  title: string;
  description?: ReactNode;
  tone?: AlertTone;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon = icons[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 shadow-sm",
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-6">{title}</p>
        {description && (
          <div className="mt-0.5 text-sm leading-5 opacity-85">{description}</div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-2 h-9 w-9 shrink-0 hover:bg-black/5 dark:hover:bg-white/10"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
