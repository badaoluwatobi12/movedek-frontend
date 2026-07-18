import { cn } from "@/lib/utils";
import type { DeliveryStatus, VerificationStatus, TrustLevel, RiskLevel } from "@/lib/types";

const deliveryMap: Record<DeliveryStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  searching: { label: "Searching", cls: "bg-accent/15 text-accent" },
  assigned: { label: "Assigned", cls: "bg-primary/10 text-primary" },
  accepted: { label: "Accepted", cls: "bg-primary/10 text-primary" },
  picked_up: { label: "Picked up", cls: "bg-warning/15 text-warning-foreground" },
  in_transit: { label: "In transit", cls: "bg-warning/15 text-warning-foreground" },
  delivered: { label: "Delivered", cls: "bg-success/15 text-success" },
  completed: { label: "Completed", cls: "bg-success/15 text-success" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
  disputed: { label: "Disputed", cls: "bg-destructive/15 text-destructive" },
};

const verifMap: Record<VerificationStatus, { label: string; cls: string }> = {
  pending: { label: "Pending review", cls: "bg-warning/15 text-warning-foreground" },
  approved: { label: "Verified", cls: "bg-success/15 text-success" },
  rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive" },
};

const riskMap: Record<RiskLevel, { label: string; cls: string }> = {
  low: { label: "Low risk", cls: "bg-success/15 text-success" },
  medium: { label: "Medium risk", cls: "bg-warning/15 text-warning-foreground" },
  high: { label: "High risk", cls: "bg-destructive/15 text-destructive" },
  very_high: { label: "Very high risk", cls: "bg-destructive/15 text-destructive" },
};

const trustMap: Record<TrustLevel, { cls: string; dot: string }> = {
  bronze: { cls: "bg-bronze/15 text-bronze", dot: "bg-bronze" },
  silver: { cls: "bg-silver/15 text-silver", dot: "bg-silver" },
  gold: { cls: "bg-gold/15 text-gold", dot: "bg-gold" },
  platinum: { cls: "bg-platinum/15 text-platinum", dot: "bg-platinum" },
};

export const StatusBadge = ({ status, className }: { status: DeliveryStatus; className?: string }) => {
  const s = deliveryMap[status];
  return <span className={cn("chip", s.cls, className)}>{s.label}</span>;
};

export const VerificationBadge = ({ status }: { status: VerificationStatus }) => {
  const s = verifMap[status];
  return <span className={cn("chip", s.cls)}>{s.label}</span>;
};

export const RiskBadge = ({ risk }: { risk: RiskLevel }) => {
  const s = riskMap[risk];
  return <span className={cn("chip", s.cls)}>{s.label}</span>;
};

export const TrustBadge = ({ level }: { level: TrustLevel }) => {
  const s = trustMap[level];
  return (
    <span className={cn("chip capitalize", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {level}
    </span>
  );
};

export const PaymentBadge = ({ status }: { status: "paid" | "pending" | "refunded" | "failed" }) => {
  const map = {
    paid: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning-foreground",
    refunded: "bg-muted text-muted-foreground",
    failed: "bg-destructive/15 text-destructive",
  } as const;
  return <span className={cn("chip capitalize", map[status])}>{status}</span>;
};
