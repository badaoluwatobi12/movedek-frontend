import { Link } from "react-router-dom";
import { useStore } from "@/data/store";
import { getStoredAuthUser } from "@/lib/authStorage";
import { StatCard, EmptyState } from "@/components/common";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/badges";
import { naira, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useWallet } from "@/hooks/useWallet";
import {
  Package,
  Wallet,
  MapPin,
  CheckCircle2,
  Plus,
  ArrowRight,
  Star,
} from "lucide-react";

export default function CustomerDashboard() {
  const me = getStoredAuthUser();
  const users = useStore((s) => s.users);
  const couriers = useStore((s) => s.couriers);
  const allSavedAddresses = useStore((s) => s.savedAddresses);
  const savedAddresses = allSavedAddresses.filter((a) => a.user_id === me?.id);
  const deliveriesQuery = useDeliveries({ page: 1, limit: 50 });
  const walletQuery = useWallet();
  const deliveries = deliveriesQuery.data?.items ?? [];
  const active = deliveries.filter((d) =>
    ["searching", "assigned", "picked_up", "in_transit"].includes(d.status),
  );
  const completed = deliveries.filter((d) => d.status === "delivered");
  const wallet = walletQuery.data?.wallet;

  if (deliveriesQuery.isLoading)
    return <LoadingState label="Loading your dashboard…" />;
  if (deliveriesQuery.isError)
    return (
      <ErrorState
        message={
          deliveriesQuery.error instanceof Error
            ? deliveriesQuery.error.message
            : "Could not load deliveries."
        }
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Welcome back, {me?.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's what's moving today.
          </p>
        </div>
        <Link to="/app/new">
          <Button className="accent-gradient text-white shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> New delivery
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active deliveries"
          value={String(active.length)}
          icon={Package}
          tone="accent"
        />
        <StatCard
          label="Completed"
          value={String(completed.length)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Wallet balance"
          value={naira(wallet?.balance ?? 0)}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Saved locations"
          value={String(savedAddresses.length)}
          icon={MapPin}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-lg font-semibold text-primary">
            Active deliveries
          </h2>
          {active.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No active deliveries"
              desc="When you send something, it will show up here."
              action={
                <Link to="/app/new">
                  <Button className="accent-gradient text-white">
                    Request delivery
                  </Button>
                </Link>
              }
            />
          ) : (
            active.map((d) => {
              const courier = couriers.find((c) => c.id === d.courier_id);
              const cUser =
                courier && users.find((u) => u.id === courier.user_id);
              return (
                <Link
                  to={`/app/track/${d.id}`}
                  key={d.id}
                  className="card-elevated block p-5 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        #{d.id.slice(0, 6).toUpperCase()} ·{" "}
                        {timeAgo(d.created_at)}
                      </div>
                      <div className="mt-1 font-display font-semibold text-primary">
                        {d.item_name}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />{" "}
                        {d.pickup_address.split(",")[0]} →{" "}
                        {d.dropoff_address.split(",")[0]}
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/40 p-3">
                    {courier && cUser ? (
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                          {cUser.full_name
                            .split(" ")
                            .map((s) => s[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {cUser.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-gold text-gold" />
                            {courier.rating.toFixed(1)} · {courier.vehicle_type}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Searching for nearby courier…
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-primary">
            Recent history
          </h2>
          {completed.slice(0, 4).map((d) => (
            <div key={d.id} className="card-soft p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{timeAgo(d.created_at)}</span>
                <StatusBadge status={d.status} />
              </div>
              <div className="mt-1 font-medium text-primary">{d.item_name}</div>
              <div className="text-xs text-muted-foreground">
                {naira(d.price)}
              </div>
            </div>
          ))}
          <Link
            to="/app/history"
            className="text-sm text-accent hover:underline inline-flex items-center gap-1"
          >
            View all history <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
