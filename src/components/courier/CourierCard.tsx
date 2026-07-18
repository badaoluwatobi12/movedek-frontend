import type { Courier } from "@/lib/types";
import { TrustBadge, VerificationBadge } from "@/components/badges";
export default function CourierCard({ courier }: { courier: Courier }) {
  return (
    <div className="card-soft p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-primary">{courier.courier_type}</h3>
          <p className="text-sm text-muted-foreground">
            Score {courier.trust_score} · {courier.rating}★
          </p>
        </div>
        <TrustBadge level={courier.trust_level} />
      </div>
      <div className="mt-2">
        <VerificationBadge status={courier.verification_status} />
      </div>
    </div>
  );
}
