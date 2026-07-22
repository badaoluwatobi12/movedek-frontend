import { LoaderCircle } from "lucide-react";

export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid min-h-44 place-items-center rounded-2xl border border-border/60 bg-card/70 p-8 text-center">
      <div>
        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">This should only take a moment.</p>
      </div>
    </div>
  );
}
