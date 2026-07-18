import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { StatCard, EmptyState } from "@/components/common";
import { StatusBadge, PaymentBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { naira, shortDate } from "@/lib/format";
import { store, useSession, useStore } from "@/data/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Users, Wallet, TrendingUp, Plus, Upload, Store } from "lucide-react";
import { toast } from "sonner";

const activeStatuses = ["searching", "assigned", "picked_up", "in_transit"];

function useCurrentMerchant() {
  const session = useSession();
  const merchants = useStore((s) => s.merchants);
  return session ? merchants.find((merchant) => merchant.user_id === session.userId) : undefined;
}

function useMerchantDeliveries() {
  const session = useSession();
  const merchant = useCurrentMerchant();
  const deliveries = useStore((s) => s.deliveries);
  if (merchant)
    return deliveries.filter(
      (delivery) => delivery.merchant_id === merchant.id || delivery.customer_id === merchant.user_id,
    );
  return session ? deliveries.filter((delivery) => delivery.customer_id === session.userId) : [];
}

export function MerchantOverview() {
  const merchant = useCurrentMerchant();
  const deliveries = useMerchantDeliveries();
  const active = deliveries.filter((d) => activeStatuses.includes(d.status));
  const monthlySpend = deliveries.reduce((sum, delivery) => sum + delivery.price, 0);
  const customerCount = new Set(
    deliveries.map((delivery) => delivery.dropoff_phone || delivery.dropoff_contact).filter(Boolean),
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            {merchant?.business_name || "Merchant dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Only real merchant data from PostgreSQL appears here.
          </p>
        </div>
        <Link to="/merchant/new">
          <Button className="accent-gradient text-white shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> New delivery
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total deliveries" value={String(deliveries.length)} icon={Package} />
        <StatCard label="Active deliveries" value={String(active.length)} icon={TrendingUp} tone="accent" />
        <StatCard label="Delivery spend" value={naira(monthlySpend)} icon={Wallet} tone="warning" />
        <StatCard label="Customers served" value={String(customerCount)} icon={Users} tone="success" />
      </div>
      <div className="card-elevated p-5">
        <h2 className="font-display font-semibold text-primary">Recent orders</h2>
        <div className="mt-4 divide-y">
          {deliveries.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              desc="Create a merchant delivery and it will appear here."
            />
          ) : (
            deliveries.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3 gap-3">
                <div>
                  <div className="font-medium text-primary">{d.item_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.dropoff_contact || "Customer"} · {shortDate(d.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{naira(d.price)}</span>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function MerchantOrders() {
  const list = useMerchantDeliveries();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary">Orders</h1>
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No merchant orders yet.
                </TableCell>
              </TableRow>
            )}
            {list.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">#{d.id.slice(0, 6).toUpperCase()}</TableCell>
                <TableCell>{d.item_name}</TableCell>
                <TableCell>{d.dropoff_contact || "—"}</TableCell>
                <TableCell>{shortDate(d.created_at)}</TableCell>
                <TableCell>{naira(d.price)}</TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MerchantBulk() {
  const [fileName, setFileName] = useState("");
  const processFile = () => {
    if (!fileName) return toast.error("Choose a CSV file first");
    toast.success(`${fileName} ready for backend CSV processing`);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary">Bulk delivery</h1>
      <div className="card-elevated p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent">
          <Upload className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display font-semibold text-primary">Upload a CSV of orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This screen is ready for real CSV backend processing. It does not add sample orders.
        </p>
        <label className="mt-4 block cursor-pointer rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm hover:bg-muted">
          <span className="font-medium text-primary">{fileName || "Choose CSV file"}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </label>
        <Button className="mt-4 accent-gradient text-white shadow-glow" onClick={processFile}>
          Process CSV
        </Button>
      </div>
    </div>
  );
}

export function MerchantCustomers() {
  const deliveries = useMerchantDeliveries();
  const rows = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; orders: number; spent: number }>();
    for (const delivery of deliveries) {
      const key = delivery.dropoff_phone || delivery.dropoff_contact || delivery.id;
      const current = map.get(key) ?? {
        name: delivery.dropoff_contact || "Unnamed customer",
        phone: delivery.dropoff_phone || "—",
        orders: 0,
        spent: 0,
      };
      current.orders += 1;
      current.spent += delivery.price;
      map.set(key, current);
    }
    return Array.from(map.values());
  }, [deliveries]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary">Customers</h1>
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Lifetime spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No customer records yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={`${r.name}-${r.phone}`}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell>{r.orders}</TableCell>
                <TableCell>{naira(r.spent)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MerchantPayments() {
  const session = useSession();
  const wallet = useStore((s) => s.wallets.find((item) => item.user_id === session?.userId));
  const deliveries = useMerchantDeliveries();
  const payments = useStore((s) =>
    s.payments.filter((payment) => deliveries.some((delivery) => delivery.id === payment.delivery_id)),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary">Payments & wallet</h1>
      <div className="card-elevated hero-gradient text-white p-6">
        <div className="text-white/80 text-sm">Wallet balance</div>
        <div className="font-display text-4xl font-bold">{naira(wallet?.balance ?? 0)}</div>
        <Button
          className="mt-4 accent-gradient text-white shadow-glow"
          onClick={() => toast.info("Connect Paystack top-up before live use")}
        >
          Top up wallet
        </Button>
      </div>
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No merchant payments yet.
                </TableCell>
              </TableRow>
            )}
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{shortDate(payment.created_at)}</TableCell>
                <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                <TableCell>{naira(payment.amount)}</TableCell>
                <TableCell>
                  <PaymentBadge status={payment.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MerchantStaff() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary">Staff</h1>
      <EmptyState
        icon={Users}
        title="No staff yet"
        desc="Invite real team members when staff accounts are connected."
        action={<Button className="accent-gradient text-white shadow-glow">Invite staff</Button>}
      />
    </div>
  );
}

export function MerchantSettings() {
  const merchant = useCurrentMerchant();
  const [businessName, setBusinessName] = useState(merchant?.business_name ?? "");
  const [businessType, setBusinessType] = useState(merchant?.business_type ?? "");
  const [address, setAddress] = useState(merchant?.address ?? "");

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!merchant) return toast.error("Merchant profile not found. Register as a merchant first.");
    store.updateMerchant(merchant.id, {
      business_name: businessName,
      business_type: businessType,
      address,
    });
    toast.success("Saved to PostgreSQL");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary">Business settings</h1>
      {!merchant && (
        <EmptyState
          icon={Store}
          title="Merchant profile not found"
          desc="Create or login with a merchant account to save business settings."
        />
      )}
      <form className="card-elevated p-5 space-y-4" onSubmit={save}>
        <div className="space-y-2">
          <Label>Business name</Label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business name"
          />
        </div>
        <div className="space-y-2">
          <Label>Business type</Label>
          <Input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="Restaurant, pharmacy, fashion, grocery…"
          />
        </div>
        <div className="space-y-2">
          <Label>Pickup address</Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your pickup address"
          />
        </div>
        <Button className="accent-gradient text-white shadow-glow">Save changes</Button>
      </form>
    </div>
  );
}
