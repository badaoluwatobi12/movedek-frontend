import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye, Package, Plus, RefreshCcw } from "lucide-react";
import { StatusBadge, PaymentBadge } from "@/components/badges";
import { EmptyState } from "@/components/common";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/data/store";
import { useDeliveries } from "@/hooks/useDeliveries";
import { naira, shortDate } from "@/lib/format";
import type { DeliveryStatus } from "@/types/delivery";

const statuses: ("all" | DeliveryStatus)[] = [
  "all",
  "pending",
  "searching",
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
];

export default function DeliveryHistory() {
  const [status, setStatus] = useState<"all" | DeliveryStatus>("all");
  const [page, setPage] = useState(1);
  const payments = useStore((s) => s.payments);
  const query = useDeliveries({
    status: status === "all" ? undefined : status,
    page,
    limit: 20,
  });
  const deliveries = query.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Delivery history
          </h1>
          <p className="text-sm text-muted-foreground">
            Live delivery records from the backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Link to="/app/new">
            <Button className="accent-gradient text-white shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> Create delivery
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item}
            onClick={() => { setStatus(item); setPage(1); }}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${
              status === item
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground"
            }`}
          >
            {item.replace("_", " ")}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading deliveries…" />
      ) : query.isError ? (
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : "Could not load deliveries."
          }
        />
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No deliveries found"
          desc="Create your first backend-powered MoveDek delivery request."
          action={
            <Link to="/app/new">
              <Button className="accent-gradient text-white shadow-glow">
                Create delivery
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => {
                const payment = payments.find(
                  (item) => item.delivery_id === delivery.id,
                );
                return (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-xs">
                      #{delivery.id.slice(0, 6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {delivery.item_name}
                    </TableCell>
                    <TableCell className="min-w-64 text-sm text-muted-foreground">
                      {delivery.pickup_address.split(",")[0]} →{" "}
                      {delivery.dropoff_address.split(",")[0]}
                    </TableCell>
                    <TableCell>{shortDate(delivery.created_at)}</TableCell>
                    <TableCell>{naira(delivery.price)}</TableCell>
                    <TableCell>
                      <PaymentBadge status={payment?.status ?? "pending"} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={delivery.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/app/track/${delivery.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
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
