import { useMemo, useState } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession, useStore } from "@/data/store";
import { disputeService } from "@/services/dispute.service";
import type { Role } from "@/lib/types";
import PaginationBar from "@/components/common/PaginationBar";
import { useClientPagination } from "@/hooks/useClientPagination";

export default function DisputesPage({ role }: { role: Role }) {
  const session = useSession()!;
  const deliveries = useStore((s) => s.deliveries);
  const disputes = useStore((s) => s.disputes);
  const relevantDeliveries = useMemo(() => deliveries.filter((d:any) => role === "courier" ? d.courier_id === session.userId || d.assigned_courier_id === session.userId : role === "merchant" ? d.merchant_id === session.userId : d.customer_id === session.userId || d.user_id === session.userId), [deliveries, role, session.userId]);
  const mine = useMemo(() => disputes.filter((d:any) => d.opened_by === session.userId || relevantDeliveries.some((delivery:any)=>delivery.id===d.delivery_id)), [disputes, relevantDeliveries, session.userId]);
  const [deliveryId, setDeliveryId] = useState("");
  const [reason, setReason] = useState("damaged_item");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const disputePage = useClientPagination(mine, 6, [role, session.userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryId) return toast.error("Choose a delivery.");
    if (details.trim().length < 10) return toast.error("Explain what happened in more detail.");
    setSubmitting(true);
    try { await disputeService.create({ delivery_id: deliveryId, reason, details: details.trim() }); setDetails(""); toast.success("Dispute submitted for review"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not open dispute"); }
    finally { setSubmitting(false); }
  };

  return <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-primary">Disputes</h1><p className="mt-1 text-sm text-muted-foreground">Open and track formal delivery-resolution cases. Support tickets should be used for general questions.</p></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
      <form onSubmit={submit} className="card-elevated space-y-5 p-5">
        <div className="flex items-start gap-3 rounded-xl bg-warning/10 p-4"><AlertTriangle className="mt-0.5 h-5 w-5 text-warning"/><div><h2 className="font-semibold text-primary">Open a formal case</h2><p className="text-sm text-muted-foreground">Use this for loss, damage, failed delivery, conduct, or a payment disagreement connected to a delivery.</p></div></div>
        <div className="space-y-2"><Label>Delivery</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={deliveryId} onChange={(e)=>setDeliveryId(e.target.value)}><option value="">Select delivery</option>{relevantDeliveries.map((d:any)=><option key={d.id} value={d.id}>{d.item_description || d.package_description || "Delivery"} — {String(d.id).slice(-8)}</option>)}</select></div>
        <div className="space-y-2"><Label>Reason</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reason} onChange={(e)=>setReason(e.target.value)}><option value="missing_item">Missing item</option><option value="damaged_item">Damaged item</option><option value="wrong_delivery">Wrong delivery</option><option value="failed_pickup">Failed pickup</option><option value="failed_delivery">Failed delivery</option><option value="payment_disagreement">Payment disagreement</option><option value="courier_conduct">Courier conduct</option><option value="customer_conduct">Customer conduct</option><option value="merchant_issue">Merchant issue</option></select></div>
        <div className="space-y-2"><Label>Details and requested resolution</Label><Textarea rows={7} value={details} onChange={(e)=>setDetails(e.target.value)} placeholder="Explain what happened, when it happened, and what you want MoveDek to review." /></div>
        <Button disabled={submitting || relevantDeliveries.length===0} className="accent-gradient text-white shadow-glow">{submitting ? "Submitting…" : "Submit dispute"}</Button>
      </form>
      <section className="space-y-3"><div><h2 className="font-display text-lg font-semibold text-primary">Your cases</h2><p className="text-sm text-muted-foreground">Formal cases remain visible for accountability.</p></div>{mine.length===0?<div className="card-elevated grid min-h-64 place-items-center p-8 text-center"><div><FileText className="mx-auto h-9 w-9 text-muted-foreground"/><h3 className="mt-3 font-semibold text-primary">No disputes yet</h3><p className="mt-1 text-sm text-muted-foreground">Submitted cases will appear here.</p></div></div>:disputePage.items.map((d:any)=><article key={d.id} className="card-elevated p-4"><div className="flex items-start justify-between gap-3"><div className="font-medium capitalize text-primary">{String(d.reason).replaceAll("_"," ")}</div><span className="chip bg-warning/15 capitalize text-warning-foreground">{String(d.status).replaceAll("_"," ")}</span></div><p className="mt-2 text-sm text-muted-foreground">{d.details}</p><div className="mt-3 text-xs text-muted-foreground">Delivery {String(d.delivery_id).slice(-8)} · {new Date(d.created_at).toLocaleDateString()}</div></article>)}<PaginationBar meta={disputePage.pagination} onPageChange={disputePage.setPage} /></section>
    </div>
  </div>;
}
