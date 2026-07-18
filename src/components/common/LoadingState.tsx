export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{label}</div>;
}
