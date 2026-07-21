import { Link } from "react-router-dom";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useWallet } from "@/hooks/useWallet";
import { useSession, useStore, store } from "@/data/store";
import { StatCard, EmptyState } from "@/components/common";
import {
  StatusBadge,
  TrustBadge,
  RiskBadge,
  VerificationBadge,
} from "@/components/badges";
import { naira, timeAgo, trustCap } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Package,
  ShieldCheck,
  Star,
  MapPin,
  ArrowRight,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { getCourierOnboardingMode } from "@/lib/courierOnboarding";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Could not load courier deliveries.";

const shortAddress = (address: string) => address.split(",")[0] || address;

export default function CourierHome() {
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const users = useStore((s) => s.users);
  const loading = useStore((s) => s.loading);
  const apiError = useStore((s) => s.apiError);
  const activeJobsQuery = useDeliveries({ scope: "active", limit: 5 });
  const availableJobsQuery = useDeliveries({ scope: "available", limit: 30 });
  const walletQuery = useWallet();

  const me = couriers.find((c) => c.user_id === session.userId);
  const user = users.find((u) => u.id === session.userId);
  const wallet = walletQuery.data?.wallet;
  const activeJobs = activeJobsQuery.data?.items ?? [];
  const availableJobs = availableJobsQuery.data?.items ?? [];
  const myTrustLevel = me?.trust_level;
  const eligibleJobs = myTrustLevel
    ? availableJobs.filter(
        (delivery) => delivery.item_value <= (trustCap[myTrustLevel] ?? 0),
      )
    : [];
  const deliveriesLoading =
    activeJobsQuery.isLoading || availableJobsQuery.isLoading;
  const deliveriesError = activeJobsQuery.error ?? availableJobsQuery.error;

  const refreshCourierWorkspace = () => {
    void store.refresh();
    void activeJobsQuery.refetch();
    void availableJobsQuery.refetch();
  };

  const toggleOnline = () => {
    if (!me) return;
    try {
      store.toggleOnline(me.id);
      toast.success(
        me.is_online ? "You are now offline" : "You are now online",
      );
      refreshCourierWorkspace();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update online status",
      );
    }
  };

  if (loading) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="Loading courier workspace"
        desc="Fetching your courier profile from PostgreSQL."
      />
    );
  }

  if (apiError) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="Backend connection issue"
        desc={apiError}
        action={<Button onClick={() => void store.refresh()}>Retry</Button>}
      />
    );
  }

  if (!me) {
    return (
      <div className="card-elevated p-5 sm:p-6 md:p-8 max-w-lg mx-auto text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warning/15 text-warning-foreground">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-primary">
          Courier profile not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This account is not registered as a courier. Create/login with a
          courier account to access courier jobs.
        </p>
      </div>
    );
  }

  if (me.verification_status !== "approved") {
    const onboardingMode = getCourierOnboardingMode(me);
    const isUnderReview = onboardingMode === "under_review";
    const isRejected = onboardingMode === "rejected";

    return (
      <div className="card-elevated p-5 sm:p-6 md:p-8 max-w-xl mx-auto text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warning/15 text-warning-foreground">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-primary">
          {isRejected
            ? "Verification needs correction"
            : isUnderReview
              ? "Verification under review"
              : "Complete courier onboarding"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRejected
            ? me.review?.reason ??
              "Update the requested courier details and submit once more for admin review."
            : isUnderReview
              ? "Your application has already been submitted. You do not need to onboard again while the admin review is pending."
              : "Complete your courier profile, documents, vehicle, and bank details once. Admin approval is required before jobs appear."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <VerificationBadge status={me.verification_status} />
          <TrustBadge level={me.trust_level} />
        </div>
        <Link to="/courier/onboarding">
          <Button className="mt-5 accent-gradient text-white shadow-glow">
            {isUnderReview
              ? "View verification status"
              : isRejected
                ? "Correct application"
                : "Start onboarding"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Hi, {user?.full_name.split(" ")[0] ?? "Courier"}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <TrustBadge level={me.trust_level} />
            <VerificationBadge status={me.verification_status} />
          </div>
        </div>
        <div className="card-elevated flex items-center gap-3 px-4 py-3">
          <div>
            <div className="text-sm font-medium">
              {me.is_online ? "You're online" : "You're offline"}
            </div>
            <div className="text-xs text-muted-foreground">
              {me.is_online
                ? "Available for eligible jobs"
                : "Go online to accept jobs"}
            </div>
          </div>
          <Switch checked={me.is_online} onCheckedChange={toggleOnline} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Wallet balance"
          value={naira(wallet?.balance ?? 0)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Completed deliveries"
          value={String(me.completed)}
          icon={Package}
        />
        <StatCard
          label="Trust score"
          value={`${me.trust_score}/100`}
          icon={ShieldCheck}
          tone="accent"
        />
        <StatCard
          label="Rating"
          value={`${me.rating.toFixed(1)}★`}
          icon={Star}
          tone="warning"
        />
      </div>

      {activeJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-primary">
            Active job
          </h2>
          {activeJobs.map((delivery) => (
            <Link
              key={delivery.id}
              to={`/courier/active/${delivery.id}`}
              className="card-elevated block p-4 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-primary">
                    {delivery.item_name}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{" "}
                    {shortAddress(delivery.pickup_address)} →{" "}
                    {shortAddress(delivery.dropoff_address)}
                  </div>
                </div>
                <StatusBadge status={delivery.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-primary">
            Available jobs
          </h2>
          <Button variant="outline" size="sm" onClick={refreshCourierWorkspace}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        {deliveriesError ? (
          <EmptyState
            icon={RefreshCcw}
            title="Could not load jobs"
            desc={getErrorMessage(deliveriesError)}
            action={<Button onClick={refreshCourierWorkspace}>Retry</Button>}
          />
        ) : !me.is_online ? (
          <EmptyState
            icon={Package}
            title="Go online to see jobs"
            desc="Toggle your status to online to start receiving delivery requests."
          />
        ) : activeJobs.length > 0 ? (
          <EmptyState
            icon={Package}
            title="Finish your active job first"
            desc="Couriers can only handle one active delivery at a time for safety."
          />
        ) : deliveriesLoading ? (
          <EmptyState
            icon={RefreshCcw}
            title="Loading available jobs"
            desc="Checking open delivery requests."
          />
        ) : eligibleJobs.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No eligible jobs right now"
            desc={
              availableJobs.length
                ? "Some jobs are above your current trust level cap."
                : "New delivery requests will appear here from the delivery API."
            }
          />
        ) : (
          eligibleJobs.map((delivery) => (
            <Link
              key={delivery.id}
              to={`/courier/jobs/${delivery.id}`}
              className="card-elevated block p-5 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="chip bg-primary/10 text-primary capitalize">
                      {delivery.item_name}
                    </span>
                    <RiskBadge risk={delivery.risk_level} />
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(delivery.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 font-display font-semibold text-primary">
                    {delivery.item_name}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{" "}
                    {shortAddress(delivery.pickup_address)} →{" "}
                    {shortAddress(delivery.dropoff_address)}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {delivery.distance_km} km · {delivery.package_size} ·{" "}
                    {naira(delivery.item_value)} declared
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-primary">
                    {naira(delivery.courier_payout)}
                  </div>
                  <div className="text-xs text-muted-foreground">payout</div>
                  <ArrowRight className="ml-auto mt-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
