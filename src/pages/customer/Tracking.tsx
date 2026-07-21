import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useSession, useStore, store } from "@/data/store";
import { DeliveryRouteMap } from "@/components/common";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { PaymentBadge, StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { naira, shortDate } from "@/lib/format";
import type { DeliveryStatus } from "@/types/delivery";
import { useCancelDelivery, useDelivery } from "@/hooks/useDeliveries";
import { usePayments } from "@/hooks/usePayments";
import { useCreateDispute, useDisputes } from "@/hooks/useDisputes";
import {
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  MapPin,
  ArrowLeft,
  AlertTriangle,
  XCircle,
  Copy,
  LifeBuoy,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const timeline: { key: DeliveryStatus; label: string }[] = [
  { key: "searching", label: "Request created" },
  { key: "assigned", label: "Courier assigned" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

const statusCopy: Partial<Record<DeliveryStatus, string>> = {
  pending: "Delivery request is pending review.",
  searching: "Waiting for a verified courier to accept this job.",
  assigned: "Your courier has accepted the delivery and should move to pickup.",
  accepted: "Your courier accepted this delivery.",
  picked_up: "Your item has been picked up.",
  in_transit: "Your item is on the way to drop-off.",
  delivered: "Delivery completed.",
  completed: "Delivery closed successfully.",
  cancelled: "Delivery cancelled.",
  disputed: "Support is reviewing this delivery.",
};

export default function Tracking() {
  const { id } = useParams();
  const session = useSession()!;
  const deliveryQuery = useDelivery(id);
  const cancelMutation = useCancelDelivery();
  const createDispute = useCreateDispute();
  const couriers = useStore((s) => s.couriers);
  const users = useStore((s) => s.users);
  const paymentsQuery = usePayments();
  const disputesQuery = useDisputes(id ? { delivery_id: id } : undefined);
  const ratings = useStore((s) => s.ratings);
  const payments = paymentsQuery.data ?? [];
  const disputes = disputesQuery.data?.items ?? [];
  const [disputeReason, setDisputeReason] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const delivery = deliveryQuery.data;

  const statusText = useMemo(() => {
    if (!delivery) return "Delivery created.";
    return statusCopy[delivery.status] ?? "Delivery created.";
  }, [delivery]);

  if (deliveryQuery.isLoading)
    return <LoadingState label="Loading delivery tracking…" />;

  if (deliveryQuery.isError) {
    return (
      <ErrorState
        message={
          deliveryQuery.error instanceof Error
            ? deliveryQuery.error.message
            : "Could not load delivery."
        }
      />
    );
  }

  if (!delivery || delivery.customer_id !== session.userId) {
    return (
      <div className="card-elevated p-6">
        Delivery not found.{" "}
        <Link className="text-accent" to="/app">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const courier = couriers.find((item) => item.id === delivery.courier_id);
  const cUser = courier && users.find((user) => user.id === courier.user_id);
  const payment = payments.find((item) => item.delivery_id === delivery.id);
  const currentIdx = Math.max(
    0,
    timeline.findIndex((item) => item.key === delivery.status),
  );
  const canCancel = ["pending", "searching", "assigned", "accepted"].includes(
    delivery.status,
  );
  const activeDispute = disputes.find(
    (item) =>
      item.delivery_id === delivery.id &&
      item.opened_by === session.userId &&
      ["open", "reviewing"].includes(item.status),
  );
  const existingRating = ratings.find(
    (item) =>
      item.delivery_id === delivery.id && item.from_user_id === session.userId,
  );
  const canDispute =
    !activeDispute &&
    !["cancelled", "pending", "searching"].includes(delivery.status);
  const canRate =
    ["delivered", "completed"].includes(delivery.status) &&
    courier &&
    !existingRating;

  const copyPin = async (pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      toast.success("PIN copied");
    } catch {
      toast.message(pin);
    }
  };

  const cancelDelivery = async () => {
    try {
      await cancelMutation.mutateAsync(delivery.id);
      toast.success("Delivery cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not cancel delivery.",
      );
    }
  };

  const openDispute = async () => {
    if (disputeReason.trim().length < 5) {
      toast.error("Add a clear dispute reason.");
      return;
    }
    try {
      await createDispute.mutateAsync({
        delivery_id: delivery.id,
        reason: disputeReason.trim(),
      });
      setDisputeReason("");
      toast.success("Dispute opened. Support can now review it.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not open dispute.",
      );
    }
  };

  const saveRating = () => {
    const result = store.rateCourierDelivery(
      delivery.id,
      session.userId,
      ratingValue,
      ratingComment,
    );
    if (result.ok) {
      setRatingComment("");
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deliveryQuery.refetch()}
            disabled={deliveryQuery.isFetching}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${deliveryQuery.isFetching ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
          {payment && <PaymentBadge status={payment.status} />}
          <StatusBadge status={delivery.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DeliveryRouteMap
            pickupAddress={delivery.pickup_address}
            dropoffAddress={delivery.dropoff_address}
            className="h-80"
          />

          <div className="card-elevated p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  Delivery #{delivery.id.slice(0, 8).toUpperCase()}
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold text-primary">
                  {delivery.item_name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {statusText}
                </p>
              </div>
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={cancelDelivery}
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {cancelMutation.isPending ? "Cancelling…" : "Cancel delivery"}
                </Button>
              )}
            </div>
          </div>

          {courier && cUser ? (
            <div className="card-elevated p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {cUser.full_name
                    .split(" ")
                    .map((value) => value[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <div className="font-display text-lg font-semibold text-primary">
                    {cUser.full_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {courier.vehicle_type}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="chip bg-gold/15 text-gold capitalize">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {courier.rating.toFixed(1)}
                    </span>
                    <span className="chip bg-success/15 text-success capitalize">
                      <ShieldCheck className="h-3 w-3" />
                      {courier.trust_level}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title={cUser.phone}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Link to="/app/support">
                    <Button variant="outline" size="icon">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-elevated p-5 text-sm text-muted-foreground">
              No courier has accepted this delivery yet. Couriers will see it
              under available jobs.
            </div>
          )}

          <div className="card-elevated p-5">
            <h3 className="mb-4 font-display font-semibold text-primary">
              Timeline
            </h3>
            <ol className="space-y-4">
              {timeline.map((item, index) => {
                const done = ["cancelled", "disputed"].includes(delivery.status)
                  ? index <= currentIdx
                  : index <= currentIdx;
                return (
                  <li key={item.key} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 h-3 w-3 rounded-full ring-4",
                        done
                          ? "bg-success ring-success/30"
                          : "bg-muted ring-muted",
                      )}
                    />
                    <div>
                      <div
                        className={cn(
                          "text-sm font-medium",
                          done ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </div>
                      {index === currentIdx &&
                        !["cancelled", "disputed"].includes(
                          delivery.status,
                        ) && (
                          <div className="text-xs text-accent">In progress</div>
                        )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {canRate && (
            <div className="card-elevated space-y-3 p-5">
              <h3 className="font-display font-semibold text-primary">
                Rate courier
              </h3>
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={ratingValue}
                    onChange={(event) =>
                      setRatingValue(Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comment</Label>
                  <Input
                    value={ratingComment}
                    onChange={(event) => setRatingComment(event.target.value)}
                    placeholder="Optional feedback"
                  />
                </div>
              </div>
              <Button
                onClick={saveRating}
                className="accent-gradient text-white shadow-glow"
              >
                Save rating
              </Button>
            </div>
          )}

          {existingRating && (
            <div className="card-elevated p-5">
              <h3 className="font-display font-semibold text-primary">
                Your rating
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">
                {existingRating.rating}/5{" "}
                {existingRating.comment ? `· ${existingRating.comment}` : ""}
              </div>
            </div>
          )}

          {canDispute && (
            <div className="card-elevated space-y-3 p-5">
              <h3 className="flex items-center gap-2 font-display font-semibold text-primary">
                <AlertTriangle className="h-4 w-4 text-warning" /> Open dispute
              </h3>
              <p className="text-sm text-muted-foreground">
                Use this only if there is a serious problem with pickup,
                delivery, payment, or the item.
              </p>
              <Textarea
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                placeholder="Explain the issue clearly"
              />
              <Button
                variant="outline"
                onClick={openDispute}
                disabled={createDispute.isPending}
              >
                {createDispute.isPending ? "Submitting…" : "Submit dispute"}
              </Button>
            </div>
          )}

          {activeDispute && (
            <div className="card-elevated border-warning/40 p-5">
              <h3 className="font-display font-semibold text-primary">
                Open dispute
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeDispute.reason}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                Status: {activeDispute.status} ·{" "}
                {shortDate(activeDispute.created_at)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-elevated p-5">
            <div className="text-xs text-muted-foreground">Package</div>
            <div className="mt-1 font-display font-semibold text-primary">
              {delivery.item_name}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Info
                label="Category"
                value={delivery.category.replace("_", " ")}
              />
              <Info label="Value" value={naira(delivery.item_value)} />
              <Info label="Distance" value={`${delivery.distance_km} km`} />
              <Info label="Fee" value={naira(delivery.price)} />
            </div>
          </div>

          <div className="card-elevated p-5">
            <h3 className="font-display font-semibold text-primary">
              Verification PINs
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Share only with your courier at the correct step.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Pin
                label="Pickup PIN"
                value={delivery.pickup_pin}
                onCopy={() => copyPin(delivery.pickup_pin)}
              />
              <Pin
                label="Drop-off PIN"
                value={delivery.dropoff_pin}
                onCopy={() => copyPin(delivery.dropoff_pin)}
              />
            </div>
          </div>

          <div className="card-elevated space-y-3 p-5 text-sm">
            <div className="font-display font-semibold text-primary">Route</div>
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-accent" />
              <div>
                <div className="font-medium">Pickup</div>
                <div className="text-muted-foreground">
                  {delivery.pickup_address}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-success" />
              <div>
                <div className="font-medium">Drop-off</div>
                <div className="text-muted-foreground">
                  {delivery.dropoff_address}
                </div>
              </div>
            </div>
          </div>

          <div className="card-elevated space-y-2 p-5 text-sm">
            <div className="font-display font-semibold text-primary">
              Payment
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-xs">
                {payment?.reference ?? "Pending"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span>{payment?.provider ?? "Pending"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span>{naira(payment?.amount ?? delivery.price)}</span>
            </div>
          </div>

          <Link to="/app/support">
            <Button variant="outline" className="w-full">
              <LifeBuoy className="mr-2 h-4 w-4" /> Contact support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 p-2">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <div className="font-medium capitalize text-primary">{value}</div>
  </div>
);

const Pin = ({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) => (
  <button
    type="button"
    onClick={onCopy}
    className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3 text-center transition hover:border-accent"
  >
    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
      {label} <Copy className="h-3 w-3" />
    </div>
    <div className="font-display text-2xl font-bold tracking-widest text-primary">
      {value}
    </div>
  </button>
);
