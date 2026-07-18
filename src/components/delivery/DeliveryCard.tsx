import type { Delivery } from "@/lib/types";
import { StatusBadge } from "@/components/badges";
import { naira } from "@/lib/format";
export default function DeliveryCard({ delivery }: { delivery: Delivery }) {
  return (
    <div className="card-soft p-4">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-semibold text-primary">{delivery.item_name}</h3>
          <p className="text-sm text-muted-foreground">
            {delivery.pickup_address} → {delivery.dropoff_address}
          </p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>
      <p className="mt-2 text-sm font-medium">{naira(delivery.price)}</p>
    </div>
  );
}
