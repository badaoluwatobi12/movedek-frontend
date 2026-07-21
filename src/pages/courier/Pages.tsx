import { useState } from "react";
import { useSession, useStore, store } from "@/data/store";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useWallet } from "@/hooks/useWallet";
import { StatusBadge, PaymentBadge } from "@/components/badges";
import { EmptyState, StatCard } from "@/components/common";
import { naira, shortDate } from "@/lib/format";
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
import { Star, Coins, Package, Wallet, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export function CourierEarnings() {
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const walletQuery = useWallet();
  const historyQuery = useDeliveries({ scope: "history", limit: 100 });
  const me = couriers.find((c) => c.user_id === session.userId);
  if (!me)
    return <EmptyState icon={Package} title="Courier profile not found" />;

  const wallet = walletQuery.data?.wallet;
  const walletTx = walletQuery.data?.transactions ?? [];
  const completedDeliveries = (historyQuery.data?.items ?? []).filter(
    (d) => d.courier_id === me.id && d.status === "delivered",
  );
  const payoutTransactions = wallet
    ? walletTx.filter(
        (tx) =>
          tx.wallet_id === wallet.id &&
          tx.type === "credit" &&
          tx.description.startsWith("Courier payout"),
      )
    : [];
  const totalEarned = completedDeliveries.reduce(
    (a, d) => a + d.courier_payout,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">
          Earnings
        </h1>
        <Button variant="outline" onClick={() => void store.refresh()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Wallet balance"
          value={naira(wallet?.balance ?? 0)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Completed jobs"
          value={String(completedDeliveries.length)}
          icon={Package}
        />
        <StatCard
          label="All-time earned"
          value={naira(totalEarned)}
          icon={Coins}
          tone="accent"
        />
      </div>
      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b font-display font-semibold text-primary">
          Payout history
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payoutTransactions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No completed payouts yet.
                </TableCell>
              </TableRow>
            )}
            {payoutTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{shortDate(tx.created_at)}</TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell className="text-success">
                  +{naira(tx.amount)}
                </TableCell>
                <TableCell>
                  <PaymentBadge
                    status={
                      tx.status === "success"
                        ? "paid"
                        : tx.status === "failed"
                          ? "failed"
                          : "pending"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
  const withdrawals = me
    ? allWithdrawals.filter((w) => w.courier_id === me.id)
    : [];
  const [amount, setAmount] = useState(5000);
  if (!me)
    return <EmptyState icon={Package} title="Courier profile not found" />;

  const request = () => {
    try {
      const created = store.requestWithdrawal(me.id, amount);
      if (!created) return toast.error("Enter a valid withdrawal amount");
      toast.success("Withdrawal requested. Your balance has been updated.");
      setAmount(5000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not request withdrawal",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Withdrawals
          </h1>
          <p className="text-sm text-muted-foreground">
            Available balance:{" "}
            <b className="text-primary">{naira(wallet?.balance ?? 0)}</b>
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            className="w-40"
            type="number"
            min={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <Button
            className="accent-gradient text-white shadow-glow"
            onClick={request}
          >
            Request withdrawal
          </Button>
        </div>
      </div>
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No withdrawal requests yet.
                </TableCell>
              </TableRow>
            )}
            {withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{shortDate(w.created_at)}</TableCell>
                <TableCell>{naira(w.amount)}</TableCell>
                <TableCell>
                  {me.bank_name} · {me.account_number}
                </TableCell>
                <TableCell>
                  <span className="chip bg-muted capitalize">{w.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
  const list = ratings.filter(
    (r) => r.to_user_id === me.user_id || r.to_user_id === me.id,
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">
          Ratings
        </h1>
        <span className="chip bg-gold/15 text-gold">
          <Star className="h-3 w-3 fill-gold text-gold" />
          {me.rating.toFixed(1)} average
        </span>
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No ratings yet"
          desc="Ratings will appear after customers rate completed deliveries."
        />
      ) : (
        list.map((r) => (
          <div key={r.id} className="card-elevated p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-primary">
                {users.find((u) => u.id === r.from_user_id)?.full_name ??
                  "Customer"}
              </div>
              <div className="flex items-center gap-1 text-gold">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold" />
                ))}
              </div>
            </div>
            {r.comment && (
              <div className="mt-1 text-sm text-muted-foreground">
                {r.comment}
              </div>
            )}
          </div>
        ))
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

  const refreshHistory = () => {
    void store.refresh();
    void historyQuery.refetch();
  };

  if (!me)
    return <EmptyState icon={Package} title="Courier profile not found" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">
          Delivery history
        </h1>
        <Button variant="outline" onClick={refreshHistory}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyQuery.isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Loading delivery history...
                </TableCell>
              </TableRow>
            )}
            {historyQuery.error && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-destructive py-8"
                >
                  Could not load delivery history.
                </TableCell>
              </TableRow>
            )}
            {!historyQuery.isLoading &&
              !historyQuery.error &&
              list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No delivery history yet.
                  </TableCell>
                </TableRow>
              )}
            {list.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell>
                  {shortDate(delivery.completed_at ?? delivery.created_at)}
                </TableCell>
                <TableCell>{delivery.item_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {delivery.pickup_address.split(",")[0]} →{" "}
                  {delivery.dropoff_address.split(",")[0]}
                </TableCell>
                <TableCell>{naira(delivery.courier_payout)}</TableCell>
                <TableCell>
                  <StatusBadge status={delivery.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
