import { useState } from "react";
import { CreditCard, RefreshCcw, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { PaymentBadge } from "@/components/badges";
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
import { usePayments, useRefundPayment } from "@/hooks/usePayments";
import { naira, shortDate } from "@/lib/format";
import type { PaymentRecord } from "@/types/payment";

function EscrowBadge({ status }: { status: PaymentRecord["escrow_status"] }) {
  const cls = {
    not_started: "bg-muted text-muted-foreground",
    held: "bg-warning/15 text-warning-foreground",
    released: "bg-success/15 text-success",
    refunded: "bg-muted text-muted-foreground",
  }[status];
  return (
    <span className={`chip capitalize ${cls}`}>{status.replace("_", " ")}</span>
  );
}

export default function AdminPayments() {
  const users = useStore((state) => state.users);
  const [search, setSearch] = useState("");
  const paymentsQuery = usePayments();
  const refundPayment = useRefundPayment();
  const payments = paymentsQuery.data ?? [];
  const filtered = payments.filter((payment) => {
    const customer = users.find((user) => user.id === payment.customer_id);
    return `${payment.reference} ${payment.delivery_id} ${customer?.full_name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const refund = async (payment: PaymentRecord) => {
    try {
      const result = await refundPayment.mutateAsync({
        id: payment.id,
        input: { reason: "Admin approved cancellation/refund review" },
      });
      toast.success(
        result.gateway_action_required
          ? "Gateway refund review recorded. Complete it in Paystack before closing the case."
          : "Wallet escrow refunded to customer.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not process refund.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Payments & escrow
          </h1>
          <p className="text-sm text-muted-foreground">
            Review paid deliveries, escrow status, wallet refunds, and Paystack
            refund actions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => paymentsQuery.refetch()}
          disabled={paymentsQuery.isFetching}
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${paymentsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by reference, delivery, or customer"
          className="pl-9"
        />
      </div>

      {paymentsQuery.isLoading ? (
        <LoadingState label="Loading backend payments…" />
      ) : paymentsQuery.isError ? (
        <ErrorState
          message={
            paymentsQuery.error instanceof Error
              ? paymentsQuery.error.message
              : "Could not load payments."
          }
        />
      ) : filtered.length === 0 ? (
        <div className="card-soft flex flex-col items-center justify-center gap-3 p-6 text-center sm:p-10">
          <div className="rounded-full bg-muted p-3 text-muted-foreground">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">
              No payments found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified delivery payments will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Escrow</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((payment) => {
                const customer = users.find(
                  (user) => user.id === payment.customer_id,
                );
                const canRefund =
                  payment.status === "paid" && payment.escrow_status === "held";
                const pendingGatewayRefund =
                  payment.metadata?.refund_review_status === "pending_gateway";

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.reference}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      #{payment.delivery_id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{customer?.full_name ?? "—"}</TableCell>
                    <TableCell>{naira(payment.amount)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.provider}
                    </TableCell>
                    <TableCell>
                      <PaymentBadge status={payment.status} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <EscrowBadge status={payment.escrow_status} />
                        {pendingGatewayRefund ? (
                          <div className="text-xs text-warning-foreground">
                            Paystack refund pending
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{shortDate(payment.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canRefund || refundPayment.isPending}
                        onClick={() => refund(payment)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Refund
                      </Button>
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
