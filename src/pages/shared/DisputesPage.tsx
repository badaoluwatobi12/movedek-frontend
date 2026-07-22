import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession, useStore } from "@/data/store";
import { disputeService } from "@/services/dispute.service";
import type { Delivery, Dispute, Role } from "@/lib/types";
import PaginationBar from "@/components/common/PaginationBar";
import { useClientPagination } from "@/hooks/useClientPagination";

type SupportedRole = Extract<Role, "customer" | "courier" | "merchant">;

const belongsToRole = (delivery: Delivery, role: SupportedRole, userId: string) => {
  if (role === "courier") {
    return delivery.courier_id === userId;
  }
  if (role === "merchant") {
    return delivery.merchant_id === userId;
  }
  return delivery.customer_id === userId;
};

export default function DisputesPage({ role }: { role: SupportedRole }) {
  const session = useSession()!;
  const deliveries = useStore((state) => state.deliveries);
  const disputes = useStore((state) => state.disputes);
  const relevantDeliveries = useMemo(
    () => deliveries.filter((delivery) => belongsToRole(delivery, role, session.userId)),
    [deliveries, role, session.userId],
  );
  const mine = useMemo(
    () =>
      disputes.filter(
        (dispute: Dispute) =>
          dispute.opened_by === session.userId ||
          dispute.user_id === session.userId ||
          relevantDeliveries.some((delivery) => delivery.id === dispute.delivery_id),
      ),
    [disputes, relevantDeliveries, session.userId],
  );
  const [deliveryId, setDeliveryId] = useState("");
  const [reason, setReason] = useState("damaged_item");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const disputePage = useClientPagination(mine, 6, [role, session.userId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deliveryId) return toast.error("Choose a delivery.");
    if (details.trim().length < 10) {
      return toast.error("Explain what happened in more detail.");
    }
    setSubmitting(true);
    try {
      await disputeService.create({ delivery_id: deliveryId, reason, details: details.trim() });
      setDetails("");
      toast.success("Dispute submitted for review");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not open dispute");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Disputes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open and track formal delivery-resolution cases. Support tickets should be used for general questions.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
        <form onSubmit={submit} className="card-elevated space-y-5 p-5">
          <div className="flex items-start gap-3 rounded-xl bg-warning/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div>
              <h2 className="font-semibold text-primary">Open a formal case</h2>
              <p className="text-sm text-muted-foreground">
                Use this for loss, damage, failed delivery, conduct, or a payment disagreement connected to a delivery.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Delivery</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={deliveryId} onChange={(event) => setDeliveryId(event.target.value)}>
              <option value="">Select delivery</option>
              {relevantDeliveries.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>
                  {delivery.item_name || "Delivery"} — {delivery.id.slice(-8)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="missing_item">Missing item</option>
              <option value="damaged_item">Damaged item</option>
              <option value="wrong_delivery">Wrong delivery</option>
              <option value="failed_pickup">Failed pickup</option>
              <option value="failed_delivery">Failed delivery</option>
              <option value="payment_disagreement">Payment disagreement</option>
              <option value="courier_conduct">Courier conduct</option>
              <option value="customer_conduct">Customer conduct</option>
              <option value="merchant_issue">Merchant issue</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Details and requested resolution</Label>
            <Textarea rows={7} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Explain what happened, when it happened, and what you want MoveDek to review." />
          </div>
          <Button disabled={submitting || relevantDeliveries.length === 0} className="accent-gradient text-white shadow-glow">
            {submitting ? "Submitting…" : "Submit dispute"}
          </Button>
        </form>
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-primary">Your cases</h2>
            <p className="text-sm text-muted-foreground">Formal cases remain visible for accountability.</p>
          </div>
          {mine.length === 0 ? (
            <div className="card-elevated grid min-h-64 place-items-center p-8 text-center">
              <div>
                <FileText className="mx-auto h-9 w-9 text-muted-foreground" />
                <h3 className="mt-3 font-semibold text-primary">No disputes yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Submitted cases will appear here.</p>
              </div>
            </div>
          ) : (
            disputePage.items.map((dispute) => (
              <article key={dispute.id} className="card-elevated p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium capitalize text-primary">{dispute.reason.replaceAll("_", " ")}</div>
                  <span className="chip bg-warning/15 capitalize text-warning-foreground">{dispute.status.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{dispute.details ?? "No additional details."}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  Delivery {dispute.delivery_id.slice(-8)} · {new Date(dispute.created_at).toLocaleDateString()}
                </div>
              </article>
            ))
          )}
          <PaginationBar meta={disputePage.pagination} onPageChange={disputePage.setPage} />
        </section>
      </div>
    </div>
  );
}
