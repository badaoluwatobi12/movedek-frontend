import { naira } from "@/lib/format";
export default function EarningsCard({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="card-soft p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold text-primary">{naira(amount)}</div>
    </div>
  );
}
