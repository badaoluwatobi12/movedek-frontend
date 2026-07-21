import { useState } from "react";
import { AlertTriangle, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
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
import { useDisputes, useUpdateDispute } from "@/hooks/useDisputes";
import { naira, shortDate } from "@/lib/format";
import type { DisputeStatus } from "@/types/dispute";
import { disputeStatuses } from "@/types/dispute";

const filterOptions: { id: "all" | DisputeStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "reviewing", label: "Reviewing" },
  { id: "resolved", label: "Resolved" },
  { id: "rejected", label: "Rejected" },
];

function DisputeBadge({ status }: { status: DisputeStatus }) {
  const cls = {
    open: "bg-destructive/15 text-destructive",
    reviewing: "bg-warning/15 text-warning-foreground",
    resolved: "bg-success/15 text-success",
    rejected: "bg-muted text-muted-foreground",
  }[status];
  return <span className={`chip capitalize ${cls}`}>{status}</span>;
}

export default function AdminDisputes() {
  const users = useStore((state) => state.users);
  const [status, setStatus] = useState<"all" | DisputeStatus>("all");
  const [search, setSearch] = useState("");
  const disputesQuery = useDisputes({
    status: status === "all" ? undefined : status,
    search: search.trim() || undefined,
    page: 1,
    limit: 100,
  });
  const updateDispute = useUpdateDispute();
  const disputes = disputesQuery.data?.items ?? [];

  const setDisputeStatus = async (id: string, nextStatus: DisputeStatus) => {
    try {
      await updateDispute.mutateAsync({
        id,
        input: {
          status: nextStatus,
          resolution:
            nextStatus === "resolved"
              ? "Admin marked this case resolved."
              : undefined,
        },
      });
      toast.success("Dispute updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update dispute.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Disputes
          </h1>
          <p className="text-sm text-muted-foreground">
            Review disputed deliveries, set case progress, and prepare refund
            decisions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => disputesQuery.refetch()}
          disabled={disputesQuery.isFetching}
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${disputesQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((item) => (
            <button
              key={item.id}
              onClick={() => setStatus(item.id)}
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search disputes"
            className="pl-9"
          />
        </div>
      </div>

      {disputesQuery.isLoading ? (
        <LoadingState label="Loading backend disputes…" />
      ) : disputesQuery.isError ? (
        <ErrorState
          message={
            disputesQuery.error instanceof Error
              ? disputesQuery.error.message
              : "Could not load disputes."
          }
        />
      ) : disputes.length === 0 ? (
        <div className="card-soft flex flex-col items-center justify-center gap-3 p-6 text-center sm:p-10">
          <div className="rounded-full bg-muted p-3 text-muted-foreground">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">
              No disputes found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer/courier disputes will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Opened by</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Refund ask</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => {
                const user = users.find(
                  (item) => item.id === dispute.opened_by,
                );
                return (
                  <TableRow key={dispute.id}>
                    <TableCell>{shortDate(dispute.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      #{dispute.delivery_id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{user?.full_name ?? "—"}</TableCell>
                    <TableCell className="min-w-72">
                      <div className="font-medium">{dispute.reason}</div>
                      {dispute.details ? (
                        <div className="text-xs text-muted-foreground">
                          {dispute.details}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {dispute.refund_amount
                        ? naira(dispute.refund_amount)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DisputeBadge status={dispute.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <select
                        value={dispute.status}
                        disabled={updateDispute.isPending}
                        onChange={(event) =>
                          setDisputeStatus(
                            dispute.id,
                            event.target.value as DisputeStatus,
                          )
                        }
                        className="h-9 min-w-36 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {disputeStatuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
