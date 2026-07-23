import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
      <div className="min-w-0 max-w-3xl">
        <h1 className="font-display break-words text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="responsive-actions shrink-0">{actions}</div>}
    </div>
  );
}
