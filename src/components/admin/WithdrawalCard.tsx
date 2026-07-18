import type { Withdrawal } from "@/lib/types";
import { naira } from "@/lib/format";
export default function WithdrawalCard({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <div className="card-soft p-4">
      <h3 className="font-semibold text-primary">{naira(withdrawal.amount)}</h3>
      <p className="text-sm text-muted-foreground">{withdrawal.status}</p>
    </div>
  );
}
