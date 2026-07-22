import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { StatCard, EmptyState } from "@/components/common";
import { LiveCourierMap } from "@/components/admin/LiveCourierMap";
import {
  StatusBadge,
  VerificationBadge,
  TrustBadge,
  PaymentBadge,
  RiskBadge,
} from "@/components/badges";
import { naira, shortDate } from "@/lib/format";
import { getPilotAccessStatus } from "@/lib/pilotAccess";
import { adminService } from "@/services/admin.service";
import { store, useStore } from "@/data/store";
import type {
  DeliveryStatus,
  Dispute,
  Payment,
  Ticket,
  TrustLevel,
  Withdrawal,
} from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Bike,
  Store,
  Package,
  CheckCircle2,
  Wallet,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  MapPin,
  RefreshCcw,
  CreditCard,
  LifeBuoy,
  Save,
  Clock3,
  Gauge,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import PaginationBar from "@/components/common/PaginationBar";
import { useClientPagination } from "@/hooks/useClientPagination";

const deliveryStatuses: DeliveryStatus[] = [
  "pending",
  "searching",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "disputed",
];
const paymentStatuses: Payment["status"][] = [
  "pending",
  "paid",
  "failed",
  "refunded",
];
const withdrawalStatuses: Withdrawal["status"][] = [
  "pending",
  "approved",
  "paid",
  "failed",
];
const disputeStatuses: Dispute["status"][] = [
  "open",
  "reviewing",
  "resolved",
  "rejected",
];
const ticketStatuses: Ticket["status"][] = ["open", "pending", "closed"];
const trustLevels: TrustLevel[] = ["bronze", "silver", "gold", "platinum"];

function initials(name?: string) {
  return (name || "SL")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function NativeSelect<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T | string;
  options: readonly T[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring ${className}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option.split("_").join(" ")}
        </option>
      ))}
    </select>
  );
}

function RefreshButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void store.refresh();
        toast.success("Dashboard refreshed from PostgreSQL");
      }}
    >
      <RefreshCcw className="mr-2 h-4 w-4" />
      Refresh
    </Button>
  );
}

function EmptyAdmin({
  icon = Package,
  title,
  desc,
}: {
  icon?: LucideIcon;
  title: string;
  desc?: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      desc={
        desc ??
        "Create real records from the app. They will appear here after PostgreSQL saves them."
      }
    />
  );
}

export function AdminOverview() {
  const all = useStore((s) => s.deliveries);
  const users = useStore((s) => s.users);
  const couriers = useStore((s) => s.couriers);
  const withdrawals = useStore((s) => s.withdrawals);
  const merchants = useStore((s) => s.merchants);
  const disputes = useStore((s) => s.disputes);
  const tickets = useStore((s) => s.tickets);
  const payments = useStore((s) => s.payments);
  const active = all.filter((d) =>
    ["searching", "assigned", "picked_up", "in_transit"].includes(d.status),
  );
  const done = all.filter((d) => d.status === "delivered");
  const pendingMoney = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);
  const paidRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const nowMs = Date.now();
  const delayed = active.filter((delivery) =>
    nowMs - new Date(delivery.assigned_at ?? delivery.created_at).getTime() >
    90 * 60 * 1000,
  );
  const stuck = active.filter((delivery) =>
    nowMs - new Date(delivery.updated_at ?? delivery.created_at).getTime() >
    45 * 60 * 1000,
  );
  const finished = all.filter((delivery) =>
    ["delivered", "cancelled", "disputed"].includes(delivery.status),
  );
  const successRate = finished.length
    ? Math.round((done.length / finished.length) * 100)
    : 0;
  const onlineCouriers = couriers.filter((courier) => courier.is_online).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Admin overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Live MoveDek control center connected to PostgreSQL.
          </p>
        </div>
        <RefreshButton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={String(users.length)} icon={Users} />
        <StatCard
          label="Couriers"
          value={String(couriers.length)}
          icon={Bike}
          tone="accent"
        />
        <StatCard
          label="Merchants"
          value={String(merchants.length)}
          icon={Store}
        />
        <StatCard
          label="Active deliveries"
          value={String(active.length)}
          icon={Package}
          tone="warning"
        />
        <StatCard
          label="Completed"
          value={String(done.length)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Pending withdrawals"
          value={naira(pendingMoney)}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Open disputes"
          value={String(
            disputes.filter(
              (d) => d.status !== "resolved" && d.status !== "rejected",
            ).length,
          )}
          icon={AlertTriangle}
        />
        <StatCard
          label="Support tickets"
          value={String(tickets.filter((t) => t.status !== "closed").length)}
          icon={LifeBuoy}
        />
        <StatCard label="Delayed deliveries" value={String(delayed.length)} icon={Clock3} tone="warning" />
        <StatCard label="Stuck deliveries" value={String(stuck.length)} icon={Activity} tone={stuck.length ? "warning" : "success"} />
        <StatCard label="Delivery success" value={`${successRate}%`} icon={Gauge} tone="success" />
        <StatCard label="Couriers online" value={String(onlineCouriers)} icon={Bike} tone="accent" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-primary">
                Current operations
              </h2>
              <p className="text-sm text-muted-foreground">
                Active deliveries are updated from real app data.
              </p>
            </div>
            <span className="chip bg-success/15 text-success">
              Revenue {naira(paidRevenue)}
            </span>
          </div>
          {active.length === 0 ? (
            <EmptyAdmin title="No active deliveries" />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.slice(0, 6).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.item_name}</TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell>{naira(d.price)}</TableCell>
                      <TableCell>{shortDate(d.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <LiveCourierMap className="h-80" />
      </div>
    </div>
  );
}

export function AdminUsers() {
  const users = useStore((s) => s.users);
  const [q, setQ] = useState("");
  const [pilotUpdating, setPilotUpdating] = useState<string | null>(null);
  const list = users.filter((u) =>
    `${u.full_name} ${u.email} ${u.phone} ${u.role}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const userPage = useClientPagination(list, 20, [q]);
  const toggle = (id: string, status: "active" | "suspended") => {
    store.setUserStatus(id, status);
    toast.success(`User ${status}`);
  };
  const updatePilotAccess = async (userId: string, enabled: boolean) => {
    if (pilotUpdating) return;
    setPilotUpdating(userId);
    try {
      if (enabled) await adminService.grantPilotAccess(userId);
      else await adminService.revokePilotAccess(userId);
      await store.refresh();
      toast.success(enabled ? "Pilot access approved" : "Pilot access revoked");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update pilot access.",
      );
    } finally {
      setPilotUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage account status and approve access to the MoveDek pilot.
          </p>
        </div>
        <RefreshButton />
      </div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search users by name, email, phone, or role"
      />
      {list.length === 0 ? (
        <EmptyAdmin icon={Users} title="No users found" />
      ) : (
        <div className="card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Pilot access</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userPage.items.map((u) => {
                const pilotStatus = getPilotAccessStatus(u);
                const updatingPilot = pilotUpdating === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || "—"}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell>
                      <span
                        className={`chip ${u.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                      >
                        {u.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`chip ${
                          pilotStatus === "approved"
                            ? "bg-success/15 text-success"
                            : pilotStatus === "revoked"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-accent/15 text-accent"
                        }`}
                      >
                        {u.internal_tester
                          ? "Internal tester"
                          : pilotStatus === "not_applicable"
                            ? "Not applicable"
                            : pilotStatus}
                      </span>
                    </TableCell>
                    <TableCell>{shortDate(u.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {pilotStatus !== "not_applicable" &&
                          !u.internal_tester &&
                          (pilotStatus === "approved" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={Boolean(pilotUpdating)}
                              onClick={() => void updatePilotAccess(u.id, false)}
                              className="border-destructive/40 text-destructive hover:text-destructive"
                            >
                              {updatingPilot ? "Revoking…" : "Revoke pilot"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={
                                Boolean(pilotUpdating) || u.status !== "active"
                              }
                              onClick={() => void updatePilotAccess(u.id, true)}
                            >
                              {updatingPilot ? "Approving…" : "Approve pilot"}
                            </Button>
                          ))}
                        {u.role !== "admin" &&
                          (u.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggle(u.id, "suspended")}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => toggle(u.id, "active")}
                            >
                              Activate
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <PaginationBar meta={userPage.pagination} onPageChange={userPage.setPage} />
        </div>
      )}
    </div>
  );
}

export function AdminCouriers() {
  const couriers = useStore((s) => s.couriers);
  const users = useStore((s) => s.users);
  const [filter, setFilter] = useState("all");
  const list =
    filter === "all"
      ? couriers
      : couriers.filter((c) => c.verification_status === filter);
  const courierPage = useClientPagination(list, 20, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Couriers
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve verification and control courier trust level.
          </p>
        </div>
        <RefreshButton />
      </div>
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "approved", "rejected"].map((x) => (
          <button
            key={x}
            onClick={() => setFilter(x)}
            className={`chip capitalize ${filter === x ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {x}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyAdmin icon={Bike} title="No couriers found" />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Online</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courierPage.items.map((c) => {
                const u = users.find((user) => user.id === c.user_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {u?.full_name ?? "Unknown courier"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {c.courier_type}
                    </TableCell>
                    <TableCell>
                      <NativeSelect
                        value={c.trust_level}
                        options={trustLevels}
                        onChange={(level) => {
                          store.setCourierTrust(c.id, level);
                          toast.success("Trust level updated");
                        }}
                      />
                    </TableCell>
                    <TableCell>{Number(c.rating || 0).toFixed(1)}★</TableCell>
                    <TableCell>
                      <VerificationBadge status={c.verification_status} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`chip ${c.is_online ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                      >
                        {c.is_online ? "Online" : "Offline"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={c.verification_status === "approved"}
                          onClick={() => {
                            store.setVerification(c.id, "approved");
                            toast.success("Courier approved and saved");
                          }}
                        >
                          {c.verification_status === "approved"
                            ? "Approved"
                            : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={c.verification_status === "rejected"}
                          onClick={() => {
                            store.setVerification(c.id, "rejected");
                            toast.error("Courier rejected and saved");
                          }}
                        >
                          {c.verification_status === "rejected"
                            ? "Rejected"
                            : "Reject"}
                        </Button>
                        <Link to={`/admin/couriers/${c.id}`}>
                          <Button variant="ghost" size="sm">
                            Review
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <PaginationBar meta={courierPage.pagination} onPageChange={courierPage.setPage} />
        </div>
      )}
    </div>
  );
}

export function AdminCourierDetail() {
  const { id } = useParams();
  const c = useStore((s) => s.couriers.find((x) => x.id === id));
  const users = useStore((s) => s.users);
  if (!c) return <div className="card-elevated p-6">Courier not found.</div>;
  const u = users.find((user) => user.id === c.user_id);
  return (
    <div className="max-w-3xl space-y-6">
      <Link
        to="/admin/couriers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="card-elevated p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold text-lg">
            {initials(u?.full_name)}
          </div>
          <div className="flex-1">
            <div className="font-display text-xl font-bold text-primary">
              {u?.full_name ?? "Unknown courier"}
            </div>
            <div className="text-sm text-muted-foreground">
              {u?.email} · {u?.phone || "No phone"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <TrustBadge level={c.trust_level} />
              <VerificationBadge status={c.verification_status} />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle" value={c.vehicle_type || "Not added"} />
          <Field
            label="Bank"
            value={`${c.bank_name || "Not added"} · ${c.account_number || "Not added"}`}
          />
          <Field label="Trust score" value={`${c.trust_score}/100`} />
          <Field label="Completed" value={`${c.completed}`} />
        </div>
        <div className="mt-6 space-y-2">
          <div className="text-sm font-medium text-primary">
            Verification documents
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Selfie", "Government ID", "Driver's license"].map((d) => (
              <div
                key={d}
                className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground"
              >
                {d}
                <div className="text-xs mt-1">Upload integration pending</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Trust level</Label>
            <NativeSelect
              value={c.trust_level}
              options={trustLevels}
              onChange={(level) => {
                store.setCourierTrust(c.id, level);
                toast.success("Trust level saved");
              }}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Verification decision</Label>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  store.setVerification(c.id, "approved");
                  toast.success("Approved");
                }}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  store.setVerification(c.id, "rejected");
                  toast.error("Rejected");
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="card-soft p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-0.5 font-medium text-primary">{value}</div>
  </div>
);

const filters: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "searching", label: "Searching" },
  { id: "assigned", label: "Assigned" },
  { id: "picked_up", label: "Picked up" },
  { id: "in_transit", label: "In transit" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "disputed", label: "Disputed" },
];

export function AdminDeliveries() {
  const [f, setF] = useState("all");
  const all = useStore((s) => s.deliveries);
  const users = useStore((s) => s.users);
  const couriers = useStore((s) => s.couriers);
  const list = f === "all" ? all : all.filter((d) => d.status === f);
  const availableCouriers = couriers.filter(
    (c) => c.verification_status === "approved",
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Deliveries
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign couriers and update delivery status.
          </p>
        </div>
        <RefreshButton />
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((x) => (
          <button
            key={x.id}
            onClick={() => setF(x.id)}
            className={`chip ${f === x.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyAdmin title="No deliveries found" />
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
              {list.map((d) => {
                const isDelivered = d.status === "delivered";
                const isCancelled = d.status === "cancelled";
                const isClosed = isDelivered || isCancelled;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">
                      #{d.id.slice(0, 6).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{d.item_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.pickup_address} → {d.dropoff_address}
                      </div>
                    </TableCell>
                    <TableCell>
                      {users.find((u) => u.id === d.customer_id)?.full_name ??
                        "—"}
                    </TableCell>
                    <TableCell>
                      <select
                        value={d.courier_id ?? ""}
                        disabled={isClosed}
                        onChange={(e) => {
                          if (e.target.value) {
                            store.assignCourier(d.id, e.target.value);
                            toast.success("Courier assigned and saved");
                          }
                        }}
                        className="h-9 min-w-40 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Unassigned</option>
                        {availableCouriers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {users.find((u) => u.id === c.user_id)?.full_name ??
                              c.courier_type}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={d.risk_level} />
                    </TableCell>
                    <TableCell>{naira(d.price)}</TableCell>
                    <TableCell>
                      <NativeSelect
                        value={d.status}
                        options={deliveryStatuses}
                        onChange={(status) => {
                          store.setDeliveryStatus(d.id, status);
                          toast.success("Delivery status saved");
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isClosed}
                          onClick={() => {
                            store.setDeliveryStatus(d.id, "cancelled");
                            toast.error("Delivery cancelled and saved");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={isDelivered || isCancelled}
                          onClick={() => {
                            store.setDeliveryStatus(d.id, "delivered");
                            toast.success("Delivery completed and saved");
                          }}
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
        </div>
      )}
    </div>
  );
}

export function AdminMap() {
  const deliveries = useStore((s) =>
    s.deliveries.filter((d) =>
      ["assigned", "picked_up", "in_transit", "searching"].includes(d.status),
    ),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">
          Live operations map
        </h1>
        <RefreshButton />
      </div>
      <LiveCourierMap className="h-[420px]" />
      {deliveries.length === 0 ? (
        <EmptyAdmin icon={MapPin} title="No live deliveries to map" />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Drop-off</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.item_name}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell>{d.pickup_address}</TableCell>
                  <TableCell>{d.dropoff_address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function AdminPayments() {
  const payments = useStore((s) => s.payments);
  const users = useStore((s) => s.users);
  const paymentPage = useClientPagination(payments, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Payments
          </h1>
          <p className="text-sm text-muted-foreground">
            Update payment status and refunds.
          </p>
        </div>
        <RefreshButton />
      </div>
      {payments.length === 0 ? (
        <EmptyAdmin icon={CreditCard} title="No payments yet" />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentPage.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">
                    {p.reference}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    #{p.delivery_id.slice(0, 6).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {users.find((u) => u.id === p.customer_id)?.full_name ??
                      "—"}
                  </TableCell>
                  <TableCell>{naira(p.amount)}</TableCell>
                  <TableCell>{p.provider}</TableCell>
                  <TableCell>
                    <PaymentBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <NativeSelect
                      value={p.status}
                      options={paymentStatuses}
                      onChange={(status) => {
                        store.setPaymentStatus(p.id, status);
                        toast.success("Payment updated");
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar meta={paymentPage.pagination} onPageChange={paymentPage.setPage} />
        </div>
      )}
    </div>
  );
}

export function AdminWithdrawals() {
  const list = useStore((s) => s.withdrawals);
  const couriers = useStore((s) => s.couriers);
  const users = useStore((s) => s.users);
  const act = (id: string, status: Withdrawal["status"]) => {
    store.setWithdrawalStatus(id, status);
    toast.success(`Marked ${status}`);
  };
  const withdrawalPage = useClientPagination(list, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Withdrawals
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve, pay, or fail courier withdrawal requests.
          </p>
        </div>
        <RefreshButton />
      </div>
      {list.length === 0 ? (
        <EmptyAdmin icon={Wallet} title="No withdrawals yet" />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawalPage.items.map((w) => {
                const c = couriers.find((x) => x.id === w.courier_id);
                return (
                  <TableRow key={w.id}>
                    <TableCell>{shortDate(w.created_at)}</TableCell>
                    <TableCell>
                      {c && users.find((u) => u.id === c.user_id)?.full_name}
                    </TableCell>
                    <TableCell>{naira(w.amount)}</TableCell>
                    <TableCell>
                      <span className="chip bg-muted capitalize">
                        {w.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(w.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button size="sm" onClick={() => act(w.id, "paid")}>
                          Mark paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(w.id, "failed")}
                        >
                          Fail
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <PaginationBar meta={withdrawalPage.pagination} onPageChange={withdrawalPage.setPage} />
        </div>
      )}
    </div>
  );
}

export function AdminDisputes() {
  const users = useStore((s) => s.users);
  const disputes = useStore((s) => s.disputes);
  const disputePage = useClientPagination(disputes, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Disputes
          </h1>
          <p className="text-sm text-muted-foreground">
            Review open disputes and update case status.
          </p>
        </div>
        <RefreshButton />
      </div>
      {disputes.length === 0 ? (
        <EmptyAdmin icon={AlertTriangle} title="No disputes yet" />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputePage.items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{shortDate(d.created_at)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    #{d.delivery_id.slice(0, 6).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {users.find((u) => u.id === d.user_id)?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>{d.reason}</TableCell>
                  <TableCell>
                    <span className="chip bg-warning/15 text-warning-foreground capitalize">
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <NativeSelect
                      value={d.status}
                      options={disputeStatuses}
                      onChange={(status) => {
                        store.setDisputeStatus(d.id, status);
                        toast.success("Dispute updated");
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar meta={disputePage.pagination} onPageChange={disputePage.setPage} />
        </div>
      )}
    </div>
  );
}

export function AdminFraud() {
  const deliveries = useStore((s) => s.deliveries);
  const users = useStore((s) => s.users);
  const alerts = deliveries.filter(
    (d) =>
      d.risk_level === "high" ||
      d.status === "disputed" ||
      d.item_value >= 100000,
  );
  const fraudPage = useClientPagination(alerts, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Fraud alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            Computed from real risky deliveries and disputes.
          </p>
        </div>
        <RefreshButton />
      </div>
      {alerts.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No fraud alerts yet"
          desc="High-risk deliveries or disputes will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {fraudPage.items.map((d) => (
            <div key={d.id} className="card-elevated p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-primary">{d.item_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Customer:{" "}
                    {users.find((u) => u.id === d.customer_id)?.full_name ??
                      "Unknown"}{" "}
                    · Value {naira(d.item_value)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <RiskBadge risk={d.risk_level} />
                  <StatusBadge status={d.status} />
                </div>
              </div>
            </div>
          ))}
          <PaginationBar meta={fraudPage.pagination} onPageChange={fraudPage.setPage} />
        </div>
      )}
    </div>
  );
}

export function AdminPricing() {
  const pricing = useStore((s) => s.settings.pricing);
  const [form, setForm] = useState(pricing);
  const update = (key: keyof typeof form, value: number) =>
    setForm((current) => ({
      ...current,
      [key]: Number.isFinite(value) ? value : 0,
    }));
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary">
        Pricing settings
      </h1>
      <form
        className="card-elevated p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          store.savePricingSettings(form);
          toast.success("Pricing saved to PostgreSQL");
        }}
      >
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label>Base fare — motorcycle (₦)</Label>
          <Input
            type="number"
            value={form.base_fare}
            onChange={(e) => update("base_fare", Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label>Per km — motorcycle (₦)</Label>
          <Input
            type="number"
            value={form.per_km}
            onChange={(e) => update("per_km", Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label>Service fee %</Label>
          <Input
            type="number"
            value={form.service_fee_percent}
            onChange={(e) =>
              update("service_fee_percent", Number(e.target.value))
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label>Protection add-on (₦)</Label>
          <Input
            type="number"
            value={form.protection_fee}
            onChange={(e) => update("protection_fee", Number(e.target.value))}
          />
        </div>
        <Button className="accent-gradient text-white shadow-glow">
          <Save className="mr-2 h-4 w-4" />
          Save pricing
        </Button>
      </form>
    </div>
  );
}

export function AdminDeliveryPolicy() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Delivery policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          MoveDek accepts safely packaged legal items through one universal delivery flow.
        </p>
      </div>
      <div className="card-elevated space-y-4 p-5">
        <div>
          <h2 className="font-semibold text-primary">Allowed deliveries</h2>
          <p className="mt-1 text-sm text-muted-foreground">Documents, parcels, groceries, legal pharmacy pickups, clothing, gifts, flowers, personal belongings, and business shipments that comply with applicable law.</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="font-semibold text-destructive">Prohibited deliveries</h2>
          <p className="mt-1 text-sm text-muted-foreground">Illegal drugs, weapons, explosives, hazardous materials, stolen or counterfeit goods, unsafe live animals, and any restricted item.</p>
        </div>
        <p className="text-xs text-muted-foreground">Customers must confirm this policy before submitting every delivery request.</p>
      </div>
    </div>
  );
}

export function AdminTrust() {
  const caps = useStore((s) => s.settings.trust_caps);
  const [form, setForm] = useState(caps);
  const set = (level: keyof typeof form, value: number) =>
    setForm((current) => ({ ...current, [level]: value }));
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary">
        Trust levels
      </h1>
      <div className="grid gap-3">
        {trustLevels.map((level) => (
          <div
            key={level}
            className="card-elevated p-4 grid gap-3 sm:grid-cols-[1fr_180px]"
          >
            <div>
              <TrustBadge level={level} />
              <div className="mt-1 text-sm text-muted-foreground">
                Maximum item value this courier level can handle.
              </div>
            </div>
            <Input
              type="number"
              value={form[level]}
              onChange={(e) => set(level, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
      <Button
        onClick={() => {
          store.saveTrustCaps(form);
          toast.success("Trust limits saved");
        }}
      >
        <Save className="mr-2 h-4 w-4" />
        Save trust limits
      </Button>
    </div>
  );
}

export function AdminSupport() {
  const tickets = useStore((s) => s.tickets);
  const users = useStore((s) => s.users);
  const ticketPage = useClientPagination(tickets, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Support tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            Update support ticket progress.
          </p>
        </div>
        <RefreshButton />
      </div>
      {tickets.length === 0 ? (
        <EmptyAdmin icon={MapPin} title="No support tickets" />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketPage.items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{shortDate(t.created_at)}</TableCell>
                  <TableCell>
                    {users.find((u) => u.id === t.user_id)?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell className="max-w-sm truncate">
                    {t.message}
                  </TableCell>
                  <TableCell>
                    <span className="chip bg-warning/15 text-warning-foreground capitalize">
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <NativeSelect
                      value={t.status}
                      options={ticketStatuses}
                      onChange={(status) => {
                        store.setTicketStatus(t.id, status);
                        toast.success("Ticket updated");
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar meta={ticketPage.pagination} onPageChange={ticketPage.setPage} />
        </div>
      )}
    </div>
  );
}

export function AdminAudit() {
  const logs = useStore((state) => state.auditLogs);
  const auditPage = useClientPagination(logs, 25);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">
          Audit log
        </h1>
        <RefreshButton />
      </div>
      {logs.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No audit logs yet"
          desc="Admin actions will appear here after you approve, suspend, update, or save settings."
        />
      ) : (
        <div className="card-elevated divide-y">
          {auditPage.items.map((log) => (
            <div
              key={log.id}
              className="grid gap-2 p-4 md:grid-cols-[130px_1fr]"
            >
              <div className="text-xs text-muted-foreground">
                {shortDate(log.created_at)}
              </div>
              <div>
                <div className="text-sm font-medium text-primary">
                  {log.action}
                </div>
                {log.details ? (
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                ) : null}
              </div>
            </div>
          ))}
          <PaginationBar meta={auditPage.pagination} onPageChange={auditPage.setPage} />
        </div>
      )}
    </div>
  );
}
