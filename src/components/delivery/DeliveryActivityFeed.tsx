import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/services/delivery.service";

export default function DeliveryActivityFeed({ deliveryId }: { deliveryId: string }) {
  const query = useQuery({ queryKey: ["delivery-activity", deliveryId], queryFn: () => deliveryService.activity(deliveryId), refetchInterval: 30_000 });
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  return <ol className="space-y-4 border-l border-border pl-5">{query.data?.map((event) => <li key={`${event.type}-${event.at}`} className="relative"><span className="absolute -left-[1.55rem] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background"/><p className="text-sm font-medium">{event.label}</p><time className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString()}</time></li>)}</ol>;
}
