import { useState } from "react";
import { RefreshCcw, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { RiskBadge, StatusBadge } from "@/components/badges";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/data/store";
import {
  useAssignCourier,
  useDeliveries,
  useUpdateDeliveryStatus,
} from "@/hooks/useDeliveries";
import { naira } from "@/lib/format";
import type { DeliveryStatus } from "@/types/delivery";
import { deliveryStatuses } from "@/types/delivery";

const filters: { id: "all" | DeliveryStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "searching", label: "Searching" },
  { id: "assigned", label: "Assigned" },
  { id: "accepted", label: "Accepted" },
  { id: "picked_up", label: "Picked up" },
  { id: "in_transit", label: "In transit" },
  { id: "delivered", label: "Delivered" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "disputed", label: "Disputed" },
];

export default function AdminDeliveries() {
  const [status, setStatus] = useState<"all" | DeliveryStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const users = useStore((state) => state.users);
  const couriers = useStore((state) => state.couriers);
  const query = useDeliveries({
    status: status === "all" ? undefined : status,
    search: search.trim() || undefined,
    page,
    limit: 25,
  });
  const assignCourier = useAssignCourier();
  const updateStatus = useUpdateDeliveryStatus();
  const deliveries = query.data?.items ?? [];
  const availableCouriers = couriers.filter(
    (courier) => courier.verification_status === "approved",
  );

  const courierName = (courierId: string | null) => {
    if (!courierId) return "Unassigned";
    const courier = couriers.find((item) => item.id === courierId);
    const user = courier && users.find((item) => item.id === courier.user_id);
    return user?.full_name ?? courier?.courier_type ?? "Assigned courier";
  };

  const assign = async (deliveryId: string, courierId: string) => {
    if (!courierId) return;
    try {
      await assignCourier.mutateAsync({
        id: deliveryId,
        input: { courier_id: courierId },
      });
      toast.success("Courier assigned.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not assign courier.",
      );
    }
  };

  const setDeliveryStatus = async (
    deliveryId: string,
    nextStatus: DeliveryStatus,
  ) => {
    try {
      await updateStatus.mutateAsync({
        id: deliveryId,
        input: { status: nextStatus },
      });
      toast.success("Delivery status updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update delivery status.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Deliveries
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign couriers and update live backend delivery records.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => { setStatus(item.id); setPage(1); }}
              className={`chip ${
                status === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search deliveries"
            className="pl-9"
          />
        </div>
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading backend deliveries…" />
      ) : query.isError ? (
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : "Could not load deliveries."
          }
        />
      ) : deliveries.length === 0 ? (
        <div className="card-soft flex flex-col items-center justify-center gap-3 p-6 text-center sm:p-10">
          <div className="rounded-full bg-muted p-3 text-muted-foreground">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">
              No deliveries found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another status or search term.
            </p>
          </div>
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quick actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => {
                const isDelivered = ["delivered", "completed"].includes(
                  delivery.status,
                );
                const isCancelled = delivery.status === "cancelled";
                const isClosed = isDelivered || isCancelled;
                const customer = users.find(
                  (user) => user.id === delivery.customer_id,
                );

                return (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-xs">
                      #{delivery.id.slice(0, 6).toUpperCase()}
                    </TableCell>
                    <TableCell className="min-w-72">
                      <div className="font-medium">{delivery.item_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {delivery.pickup_address} → {delivery.dropoff_address}
                      </div>
                    </TableCell>
                    <TableCell>{customer?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <select
                          value={delivery.courier_id ?? ""}
                          disabled={isClosed || assignCourier.isPending}
                          onChange={(event) =>
                            assign(delivery.id, event.target.value)
                          }
                          className="h-9 min-w-40 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">Unassigned</option>
                          {availableCouriers.map((courier) => (
                            <option key={courier.id} value={courier.id}>
                              {courierName(courier.id)}
                            </option>
                          ))}
                        </select>
                        {delivery.courier_id && (
                          <div className="text-xs text-muted-foreground">
                            Current: {courierName(delivery.courier_id)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={delivery.risk_level} />
                    </TableCell>
                    <TableCell>{naira(delivery.price)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={delivery.status} />
                        <select
                          value={delivery.status}
                          disabled={updateStatus.isPending}
                          onChange={(event) =>
                            setDeliveryStatus(
                              delivery.id,
                              event.target.value as DeliveryStatus,
                            )
                          }
                          className="h-9 min-w-36 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deliveryStatuses.map((item) => (
                            <option key={item} value={item}>
                              {item.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isClosed || updateStatus.isPending}
                          onClick={() =>
                            setDeliveryStatus(delivery.id, "cancelled")
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            isDelivered || isCancelled || updateStatus.isPending
                          }
                          onClick={() =>
                            setDeliveryStatus(delivery.id, "delivered")
                          }
                        >
                          {isDelivered ? "Completed" : "Complete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {query.data && <PaginationBar meta={query.data.pagination} onPageChange={setPage} disabled={query.isFetching} />}
        </div>
      )}
    </div>
  );
}
