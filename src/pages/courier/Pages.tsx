import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession, useStore, store } from "@/data/store";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useWallet } from "@/hooks/useWallet";
import { StatusBadge, PaymentBadge } from "@/components/badges";
import { EmptyState, StatCard } from "@/components/common";
import PageHeader from "@/components/common/PageHeader";
import { naira, shortDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Coins,
  History,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

const sectionCard = "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm";

export function CourierEarnings() {
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const walletQuery = useWallet();
  const historyQuery = useDeliveries({ scope: "history", limit: 100 });
  const me = couriers.find((c) => c.user_id === session.userId);
  if (!me) return <EmptyState icon={Package} title="Courier profile not found" />;

  const wallet = walletQuery.data?.wallet;
  const walletTx = walletQuery.data?.transactions ?? [];
  const completedDeliveries = (historyQuery.data?.items ?? []).filter(
    (d) => d.courier_id === me.id && d.status === "delivered",
  );
  const payoutTransactions = wallet
    ? walletTx.filter(
        (tx) => tx.wallet_id === wallet.id && tx.type === "credit" && tx.description.startsWith("Courier payout"),
      )
    : [];
  const totalEarned = completedDeliveries.reduce((a, d) => a + d.courier_payout, 0);
  const averagePayout = completedDeliveries.length ? totalEarned / completedDeliveries.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Earnings" subtitle="Track wallet credits, completed jobs, and courier payouts." />
        <Button variant="outline" onClick={() => void store.refresh()}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-6 text-white shadow-lg sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/75"><Sparkles className="h-4 w-4" /> Available earnings</div>
            <div className="mt-3 font-display text-4xl font-bold tracking-tight">{naira(wallet?.balance ?? 0)}</div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Funds released from completed deliveries appear here before withdrawal.</p>
          </div>
          <Button asChild variant="secondary" className="w-full bg-white text-emerald-900 hover:bg-white/90 lg:w-auto">
            <Link to="/courier/withdrawals">Withdraw funds <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Wallet balance" value={naira(wallet?.balance ?? 0)} icon={Wallet} tone="success" />
        <StatCard label="Completed jobs" value={String(completedDeliveries.length)} icon={Package} />
        <StatCard label="All-time earned" value={naira(totalEarned)} icon={Coins} tone="accent" />
        <StatCard label="Average payout" value={naira(averagePayout)} icon={TrendingUp} tone="warning" />
      </div>

      <div className={sectionCard}>
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-display font-semibold text-primary">Payout activity</h2>
            <p className="mt-1 text-xs text-muted-foreground">Credits released after successful deliveries.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{payoutTransactions.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {payoutTransactions.length === 0 && <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">No completed payouts yet.</TableCell></TableRow>}
              {payoutTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">{shortDate(tx.created_at)}</TableCell>
                  <TableCell className="min-w-[18rem]">{tx.description}</TableCell>
                  <TableCell className="font-semibold text-success">+{naira(tx.amount)}</TableCell>
                  <TableCell><PaymentBadge status={tx.status === "success" ? "paid" : tx.status === "failed" ? "failed" : "pending"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export function CourierWithdrawals() {
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const wallets = useStore((s) => s.wallets);
  const allWithdrawals = useStore((s) => s.withdrawals);
  const me = couriers.find((c) => c.user_id === session.userId);
  const wallet = me ? wallets.find((w) => w.user_id === me.user_id) : undefined;
  const withdrawals = me ? allWithdrawals.filter((w) => w.courier_id === me.id) : [];
  const [amount, setAmount] = useState(5000);
  if (!me) return <EmptyState icon={Package} title="Courier profile not found" />;

  const balance = wallet?.balance ?? 0;
  const canWithdraw = amount >= 1000 && amount <= balance && Boolean(me.bank_name && me.account_number);
  const request = () => {
    if (!me.bank_name || !me.account_number) return toast.error("Add your bank details before requesting a withdrawal.");
    if (amount < 1000) return toast.error("Minimum withdrawal is ₦1,000.");
    if (amount > balance) return toast.error("Withdrawal amount is above your available balance.");
    try {
      const created = store.requestWithdrawal(me.id, amount);
      if (!created) return toast.error("Enter a valid withdrawal amount");
      toast.success("Withdrawal request submitted", { description: "You will receive an alert when its status changes." });
      setAmount(5000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request withdrawal");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawals" subtitle="Move available courier earnings to your verified bank account." />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-600 p-6 text-white shadow-lg">
          <p className="text-sm text-white/70">Available balance</p>
          <div className="mt-2 font-display text-4xl font-bold">{naira(balance)}</div>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-white/60">Payout account</div>
            <div className="mt-2 font-medium">{me.bank_name || "Bank details required"}</div>
            <div className="text-sm text-white/70">{me.account_number || "Complete onboarding to add an account"}</div>
          </div>
        </div>
        <div className={`${sectionCard} p-5 sm:p-6`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ArrowDownToLine className="h-5 w-5" /></div>
          <h2 className="mt-4 font-display text-lg font-semibold">Request withdrawal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Minimum withdrawal is ₦1,000.</p>
          <div className="mt-5 space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input type="number" min={1000} max={balance} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <div className="flex gap-2 pt-1">
              {[5000, 10000, balance].filter((value, index, list) => value > 0 && value <= balance && list.indexOf(value) === index).map((value) => (
                <Button key={value} type="button" variant="outline" size="sm" onClick={() => setAmount(value)}>{value === balance ? "All" : naira(value)}</Button>
              ))}
            </div>
          </div>
          <Button className="mt-5 w-full" disabled={!canWithdraw} onClick={request}>Request withdrawal</Button>
        </div>
      </div>

      <div className={sectionCard}>
        <div className="border-b p-5"><h2 className="font-display font-semibold text-primary">Withdrawal history</h2><p className="mt-1 text-xs text-muted-foreground">Status changes also appear in your alerts.</p></div>
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Bank</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
          {withdrawals.length === 0 && <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">No withdrawal requests yet.</TableCell></TableRow>}
          {withdrawals.map((w) => <TableRow key={w.id}><TableCell>{shortDate(w.created_at)}</TableCell><TableCell className="font-semibold">{naira(w.amount)}</TableCell><TableCell>{me.bank_name} · {me.account_number}</TableCell><TableCell><span className="chip bg-muted capitalize">{w.status}</span></TableCell></TableRow>)}
        </TableBody></Table></div>
      </div>
    </div>
  );
}

export function CourierRatings() {
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const users = useStore((s) => s.users);
  const ratings = useStore((s) => s.ratings);
  const me = couriers.find((c) => c.user_id === session.userId);
  if (!me) return <EmptyState icon={Star} title="Courier profile not found" />;
  const list = ratings.filter((r) => r.to_user_id === me.user_id || r.to_user_id === me.id);
  const fiveStar = list.filter((rating) => rating.rating === 5).length;
  return (
    <div className="space-y-6">
      <PageHeader title="Ratings" subtitle="Customer feedback from your completed deliveries." />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 p-6 sm:col-span-1"><Star className="h-7 w-7 fill-amber-400 text-amber-400" /><div className="mt-4 font-display text-4xl font-bold text-amber-950">{me.rating.toFixed(1)}</div><p className="mt-1 text-sm text-amber-900/70">Average courier rating</p></div>
        <StatCard label="Total reviews" value={String(list.length)} icon={Star} tone="warning" />
        <StatCard label="Five-star reviews" value={String(fiveStar)} icon={CheckCircle2} tone="success" />
      </div>
      {list.length === 0 ? <EmptyState icon={Star} title="No ratings yet" desc="Ratings will appear after customers rate completed deliveries." /> : (
        <div className="grid gap-4 lg:grid-cols-2">{list.map((r) => <article key={r.id} className={`${sectionCard} p-5`}><div className="flex items-start justify-between gap-4"><div><div className="font-medium text-primary">{users.find((u) => u.id === r.from_user_id)?.full_name ?? "Customer"}</div><div className="mt-1 flex items-center gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400" : "text-muted"}`} />)}</div></div><ShieldCheck className="h-5 w-5 text-primary/60" /></div>{r.comment && <p className="mt-4 text-sm leading-6 text-muted-foreground">“{r.comment}”</p>}</article>)}</div>
      )}
    </div>
  );
}

export function CourierHistory() {
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const me = couriers.find((c) => c.user_id === session.userId);
  const historyQuery = useDeliveries({ scope: "history", limit: 100 });
  const list = historyQuery.data?.items ?? [];
  const delivered = list.filter((item) => item.status === "delivered");
  const totalPayout = delivered.reduce((sum, delivery) => sum + delivery.courier_payout, 0);
  const refreshHistory = () => { void store.refresh(); void historyQuery.refetch(); };
  if (!me) return <EmptyState icon={Package} title="Courier profile not found" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><PageHeader title="Delivery history" subtitle="Review completed, cancelled, and past courier jobs." /><Button variant="outline" onClick={refreshHistory}><RefreshCcw className="mr-2 h-4 w-4" /> Refresh</Button></div>
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Completed deliveries" value={String(delivered.length)} icon={CheckCircle2} tone="success" /><StatCard label="Recorded jobs" value={String(list.length)} icon={History} /><StatCard label="History payout" value={naira(totalPayout)} icon={Coins} tone="accent" /></div>
      <div className={sectionCard}><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Route</TableHead><TableHead>Payout</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>
        {historyQuery.isLoading && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading delivery history...</TableCell></TableRow>}
        {historyQuery.error && <TableRow><TableCell colSpan={6} className="py-12 text-center text-destructive">Could not load delivery history.</TableCell></TableRow>}
        {!historyQuery.isLoading && !historyQuery.error && list.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No delivery history yet.</TableCell></TableRow>}
        {list.map((delivery) => <TableRow key={delivery.id}><TableCell className="whitespace-nowrap"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{shortDate(delivery.completed_at ?? delivery.created_at)}</div></TableCell><TableCell className="font-medium">{delivery.item_name}</TableCell><TableCell className="min-w-[18rem] text-sm text-muted-foreground">{delivery.pickup_address.split(",")[0]} → {delivery.dropoff_address.split(",")[0]}</TableCell><TableCell className="font-semibold">{naira(delivery.courier_payout)}</TableCell><TableCell><StatusBadge status={delivery.status} /></TableCell><TableCell><Button asChild variant="ghost" size="sm"><Link to={`/courier/jobs/${delivery.id}`}>View</Link></Button></TableCell></TableRow>)}
      </TableBody></Table></div></div>
    </div>
  );
}
