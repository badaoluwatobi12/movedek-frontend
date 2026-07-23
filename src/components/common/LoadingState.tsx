import { LoaderCircle } from "lucide-react";

export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid min-h-52 place-items-center rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-10">
      <div className="max-w-xs">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10">
          <LoaderCircle className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Please wait while MoveDek prepares this page.</p>
      </div>
    </div>
  );
}
