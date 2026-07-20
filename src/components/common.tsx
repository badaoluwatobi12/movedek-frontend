import { cn } from "@/lib/utils";
import { MapPin, Navigation, type LucideIcon } from "lucide-react";

export { DeliveryRouteMap } from "./common/DeliveryRouteMap";

export const MapPlaceholder = ({ className, label = "Live map" }: { className?: string; label?: string }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/10 h-64 md:h-80",
      className,
    )}
  >
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary)/0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.08) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
      <div className="relative mx-auto h-14 w-14">
        <span className="absolute inset-0 rounded-full bg-accent/40 animate-pulse-ring" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glow">
          <Navigation className="h-6 w-6" />
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-primary">{label}</p>
    </div>
    <div className="absolute left-4 top-4 chip bg-card/80 backdrop-blur text-foreground">
      <MapPin className="h-3 w-3" /> Lagos
    </div>
  </div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) => (
  <div className="card-soft flex flex-col items-center justify-center gap-3 p-6 text-center sm:p-10">
    <div className="rounded-full bg-muted p-3 text-muted-foreground">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
    </div>
    {action}
  </div>
);

export const StatCard = ({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "accent";
}) => {
  const toneCls = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn("rounded-full p-2", toneCls)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="font-display text-2xl font-bold text-primary">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

export const Stepper = ({ steps, current }: { steps: string[]; current: number }) => (
  <ol className="flex items-center gap-2 overflow-x-auto pb-2">
    {steps.map((s, i) => {
      const done = i < current,
        active = i === current;
      return (
        <li key={s} className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
              done
                ? "bg-success text-success-foreground"
                : active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
          <span className={cn("text-sm", active ? "font-medium text-foreground" : "text-muted-foreground")}>
            {s}
          </span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
        </li>
      );
    })}
  </ol>
);

export const PinInput = ({
  value,
  onChange,
  length = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}) => (
  <div
    className="grid w-full max-w-sm gap-2"
    style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
  >
    {Array.from({ length }).map((_, i) => (
      <input
        key={i}
        inputMode="numeric"
        maxLength={1}
        value={value[i] ?? ""}
        onChange={(e) => {
          const arr = value.split("");
          arr[i] = e.target.value.replace(/\D/g, "");
          onChange(arr.join("").slice(0, length));
          const next = e.target.parentElement?.children[i + 1] as HTMLInputElement | undefined;
          if (e.target.value && next) next.focus();
        }}
        className="h-12 min-w-0 w-full rounded-xl border border-border bg-card text-center font-display text-xl font-bold text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-14 sm:text-2xl"
      />
    ))}
  </div>
);

export const UploadPlaceholder = ({ label, done }: { label: string; done?: boolean }) => (
  <label
    className={cn(
      "flex cursor-pointer items-center justify-between rounded-xl border border-dashed p-4 text-sm",
      done ? "border-success/50 bg-success/5 text-success" : "border-border bg-muted/40 hover:bg-muted",
    )}
  >
    <span>{label}</span>
    <span className="chip bg-card">{done ? "Uploaded" : "Tap to upload"}</span>
    <input type="file" className="hidden" />
  </label>
);
