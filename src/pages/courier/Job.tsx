import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  useDelivery,
  useAssignCourier,
  useUpdateDeliveryStatus,
} from "@/hooks/useDeliveries";
import { useStore, store, useSession } from "@/data/store";
import { Button } from "@/components/ui/button";
import { StatusBadge, RiskBadge, TrustBadge } from "@/components/badges";
import {
  PinInput,
  Stepper,
  DeliveryRouteMap,
  EmptyState,
} from "@/components/common";
import { naira, trustCap, shortDate } from "@/lib/format";
import {
  ArrowLeft,
  MapPin,
  ShieldAlert,
  Package,
  CheckCircle2,
  Truck,
  Camera,
  RefreshCcw,
  Phone,
  Image as ImageIcon,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { DeliveryStatus } from "@/types/delivery";
import {
  deliveryProofService,
  type DeliveryProof,
  type DeliveryProofSet,
  type DeliveryProofType,
} from "@/services/deliveryProof.service";

const Info = ({
  title,
  address,
  contact,
  note,
}: {
  title: string;
  address: string;
  contact: string;
  note?: string | null;
}) => (
  <div className="card-soft p-4">
    <div className="text-xs uppercase tracking-widest text-muted-foreground">
      {title}
    </div>
    <div className="mt-1 flex gap-2">
      <MapPin className="h-4 w-4 mt-0.5 text-accent" />
      <div>
        <div className="font-medium text-primary">{address}</div>
        <div className="text-xs text-muted-foreground">{contact}</div>
        {note && (
          <div className="text-xs text-muted-foreground mt-1">Note: {note}</div>
        )}
      </div>
    </div>
  </div>
);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Could not load this delivery.";

export function JobDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const deliveryQuery = useDelivery(id);
  const assignCourier = useAssignCourier();
  const d = deliveryQuery.data;
  const me = couriers.find((c) => c.user_id === session.userId);

  if (deliveryQuery.isLoading) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="Loading job"
        desc="Fetching delivery details."
      />
    );
  }

  if (deliveryQuery.error) {
    return (
      <EmptyState
        icon={Package}
        title="Could not load job"
        desc={getErrorMessage(deliveryQuery.error)}
        action={
          <Button onClick={() => void deliveryQuery.refetch()}>Retry</Button>
        }
      />
    );
  }

  if (!d) {
    return (
      <EmptyState
        icon={Package}
        title="Job not found"
        desc="This delivery may have been removed or already accepted."
      />
    );
  }

  if (!me) {
    return (
      <EmptyState
        icon={Package}
        title="Courier profile not found"
        desc="Complete courier registration first."
      />
    );
  }

  const cap = trustCap[me.trust_level] ?? 0;
  const allowed =
    d.item_value <= cap &&
    ["pending", "searching"].includes(d.status) &&
    !d.courier_id &&
    me.is_online &&
    me.verification_status === "approved";
  const reason = !me.is_online
    ? "Go online before accepting jobs."
    : me.verification_status !== "approved"
      ? "Admin must approve your courier verification first."
      : !["pending", "searching"].includes(d.status) || d.courier_id
        ? "This job is no longer available."
        : d.item_value > cap
          ? `Your ${me.trust_level} level allows deliveries up to ${naira(cap)}.`
          : "";

  const accept = async () => {
    try {
      const delivery = await assignCourier.mutateAsync({
        id: d.id,
        input: { courier_id: me.id },
      });
      toast.success("Job accepted");
      void store.refresh();
      nav(`/courier/active/${delivery.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not accept this job",
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        to="/courier"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-primary/10 text-primary capitalize">
            {d.item_name}
          </span>
          <RiskBadge risk={d.risk_level} />
          <StatusBadge status={d.status} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            {d.item_name}
          </h1>
          <div className="text-sm text-muted-foreground">
            Declared value {naira(d.item_value)} · {d.package_size} ·{" "}
            {d.distance_km} km · Created {shortDate(d.created_at)}
          </div>
        </div>
        <DeliveryRouteMap
          pickupAddress={d.pickup_address}
          dropoffAddress={d.dropoff_address}
          className="h-56"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Info
            title="Pickup"
            address={d.pickup_address}
            contact={`${d.pickup_contact || "—"} · ${d.pickup_phone || "—"}`}
            note={d.pickup_notes}
          />
          <Info
            title="Drop-off"
            address={d.dropoff_address}
            contact={`${d.dropoff_contact || "—"} · ${d.dropoff_phone || "—"}`}
            note={d.dropoff_notes}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
          <div>
            <div className="text-xs text-muted-foreground">
              Estimated payout
            </div>
            <div className="font-display text-2xl font-bold text-primary">
              {naira(d.courier_payout)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Your level</div>
            <TrustBadge level={me.trust_level} />
            <div className="text-xs text-muted-foreground mt-1">
              Cap: {naira(cap)}
            </div>
          </div>
        </div>
        {!allowed && reason && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5" /> {reason}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => nav("/courier")}
          >
            Reject / Back
          </Button>
          <Button
            className="flex-1 accent-gradient text-white shadow-glow"
            onClick={() => void accept()}
            disabled={!allowed || assignCourier.isPending}
          >
            {assignCourier.isPending ? "Accepting..." : "Accept job"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const activeSteps = [
  "Go to pickup",
  "Pickup PIN",
  "Pickup proof",
  "Go to drop-off",
  "Drop-off PIN",
  "Delivery proof",
  "Complete",
];

const stepFromStatus = (status: DeliveryStatus) => {
  if (status === "assigned" || status === "accepted") return 0;
  if (status === "picked_up") return 3;
  if (status === "in_transit") return 4;
  if (status === "delivered" || status === "completed") return 6;
  return 0;
};

const phoneHref = (phone: string) => {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : undefined;
};

function DeliveryContactCard({
  role,
  name,
  phone,
  address,
  active,
}: {
  role: "Sender" | "Receiver";
  name: string;
  phone: string;
  address: string;
  active: boolean;
}) {
  const href = phoneHref(phone);
  return (
    <div
      className={`rounded-xl border p-4 ${
        active ? "border-accent bg-accent/10" : "border-border bg-muted/20"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {role}
      </div>
      <div className="mt-1 font-semibold text-primary">{name || "Contact"}</div>
      <div className="text-sm text-muted-foreground">{phone || "No phone number"}</div>
      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{address}</div>
      {href ? (
        <Button asChild variant={active ? "default" : "outline"} size="sm" className="mt-3 w-full">
          <a href={href} aria-label={`Call ${role.toLowerCase()} ${name}`}>
            <Phone className="h-4 w-4" /> Call {role.toLowerCase()}
          </a>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="mt-3 w-full" disabled>
          <Phone className="h-4 w-4" /> Number unavailable
        </Button>
      )}
    </div>
  );
}

function RealProofUpload({
  label,
  proofType,
  proof,
  uploading,
  onUpload,
  onView,
}: {
  label: string;
  proofType: DeliveryProofType;
  proof: DeliveryProof | null;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onView: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await onUpload(file);
  };

  return (
    <div className="rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(event) => void selectFile(event)}
        disabled={uploading}
        aria-label={`${label} image`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-primary">
            <ImageIcon className="h-4 w-4" /> {label}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Take a clear, real photo. JPEG, PNG, or WebP only.
          </div>
        </div>
        {proof && (
          <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            Uploaded
          </span>
        )}
      </div>

      {proof && (
        <div className="mt-3 rounded-lg bg-background p-3 text-sm">
          <div className="font-medium text-primary">{proof.original_name}</div>
          <div className="text-xs text-muted-foreground">
            {Math.max(1, Math.round(proof.size_bytes / 1024))} KB · {proof.mime_type}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={proof ? "outline" : "default"}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {uploading
            ? "Uploading..."
            : proof
              ? "Replace real photo"
              : proofType === "pickup"
                ? "Take pickup photo"
                : "Take delivery photo"}
        </Button>
        {proof && (
          <Button type="button" variant="outline" onClick={onView}>
            <Eye className="h-4 w-4" /> View securely
          </Button>
        )}
      </div>
    </div>
  );
}

export function ActiveJob() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useSession()!;
  const couriers = useStore((s) => s.couriers);
  const deliveryQuery = useDelivery(id);
  const updateStatus = useUpdateDeliveryStatus();
  const d = deliveryQuery.data;
  const me = couriers.find((c) => c.user_id === session.userId);
  const [manualStep, setManualStep] = useState(0);
  const [pickupPin, setPickupPin] = useState("");
  const [dropoffPin, setDropoffPin] = useState("");
  const [proofs, setProofs] = useState<DeliveryProofSet>({
    pickup: null,
    delivery: null,
  });
  const [proofsLoading, setProofsLoading] = useState(false);
  const [uploadingProof, setUploadingProof] =
    useState<DeliveryProofType | null>(null);

  const currentStep = useMemo(
    () => Math.max(manualStep, d ? stepFromStatus(d.status) : 0),
    [manualStep, d],
  );

  useEffect(() => {
    if (!id) return;
    let active = true;
    setProofsLoading(true);
    void deliveryProofService
      .list(id)
      .then((result) => {
        if (active) setProofs(result);
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load delivery proof.",
          );
        }
      })
      .finally(() => {
        if (active) setProofsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (deliveryQuery.isLoading) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="Loading active job"
        desc="Fetching your assigned delivery."
      />
    );
  }

  if (deliveryQuery.error) {
    return (
      <EmptyState
        icon={Package}
        title="Could not load active job"
        desc={getErrorMessage(deliveryQuery.error)}
        action={
          <Button onClick={() => void deliveryQuery.refetch()}>Retry</Button>
        }
      />
    );
  }

  if (!d) return <EmptyState icon={Package} title="Job not found" />;

  if (!me || d.courier_id !== me.id) {
    return (
      <EmptyState
        icon={Package}
        title="This job is not assigned to you"
        desc="Go back to your courier home to see your active jobs."
      />
    );
  }

  const uploadProof = async (
    proofType: DeliveryProofType,
    file: File,
  ) => {
    if (!id || uploadingProof) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose a real image file.");
      return;
    }
    setUploadingProof(proofType);
    try {
      const proof = await deliveryProofService.upload(id, proofType, file);
      setProofs((current) => ({ ...current, [proofType]: proof }));
      toast.success(
        proofType === "pickup"
          ? "Pickup photo uploaded"
          : "Delivery photo uploaded",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Photo upload failed.",
      );
    } finally {
      setUploadingProof(null);
    }
  };

  const viewProof = (proofType: DeliveryProofType) => {
    if (!id) return;
    window.open(
      deliveryProofService.accessUrl(id, proofType),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const updateJobStatus = async (status: DeliveryStatus, pin?: string) => {
    await updateStatus.mutateAsync({
      id: d.id,
      input: { status, ...(pin ? { pin } : {}) },
    });
    void store.refresh();
  };

  const advance = async () => {
    try {
      if (d.status === "delivered" || d.status === "completed") {
        nav("/courier/history");
        return;
      }

      if (currentStep === 0) {
        setManualStep(1);
        return;
      }

      if (currentStep === 1) {
        if (!/^\d{4,6}$/.test(pickupPin))
          return toast.error("Enter the 4-digit pickup PIN");
        setManualStep(2);
        return;
      }

      if (currentStep === 2) {
        if (!proofs.pickup)
          return toast.error("Take and upload a real pickup photo to continue");
        await updateJobStatus("picked_up", pickupPin);
        toast.success("Pickup confirmed");
        setManualStep(3);
        return;
      }

      if (currentStep === 3) {
        await updateJobStatus("in_transit");
        toast.success("Transit started");
        setManualStep(4);
        return;
      }

      if (currentStep === 4) {
        if (!/^\d{4,6}$/.test(dropoffPin))
          return toast.error("Enter the 4-digit drop-off PIN");
        setManualStep(5);
        return;
      }

      if (currentStep === 5) {
        if (!proofs.delivery)
          return toast.error("Take and upload a real delivery photo to continue");
        setManualStep(6);
        return;
      }

      await updateJobStatus("delivered", dropoffPin);
      toast.success(
        "Delivery completed. Payout has been released for processing.",
      );
      nav("/courier/earnings");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update delivery status",
      );
    }
  };

  const buttonLabel =
    currentStep === 6
      ? "Complete delivery"
      : currentStep === 0
        ? "I have arrived at pickup"
        : currentStep === 3
          ? "Start trip to drop-off"
          : "Continue";

  const pickupSide = currentStep <= 2;
  const confirmationPerson = pickupSide ? "sender" : "receiver";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/courier"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Jobs
        </Link>
        <StatusBadge status={d.status} />
      </div>
      <Stepper steps={activeSteps} current={currentStep} />
      <div className="card-elevated space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-primary">
              {d.item_name}
            </h1>
            <div className="text-sm text-muted-foreground">
              Payout {naira(d.courier_payout)} · {d.distance_km} km
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-right text-xs text-muted-foreground">
            <div>Confirmation</div>
            <div className="text-primary">
              Ask the {confirmationPerson} for the PIN
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DeliveryContactCard
            role="Sender"
            name={d.pickup_contact}
            phone={d.pickup_phone}
            address={d.pickup_address}
            active={pickupSide}
          />
          <DeliveryContactCard
            role="Receiver"
            name={d.dropoff_contact}
            phone={d.dropoff_phone}
            address={d.dropoff_address}
            active={!pickupSide}
          />
        </div>

        {currentStep === 0 && (
          <div className="space-y-3">
            <div className="rounded-xl bg-accent/10 p-4 text-sm">
              <Truck className="mr-2 inline h-4 w-4" />
              Head to <b>{d.pickup_address}</b>. Call {d.pickup_contact} if you
              need pickup directions.
            </div>
            <DeliveryRouteMap
              pickupAddress={d.pickup_address}
              dropoffAddress={d.dropoff_address}
              className="h-56"
            />
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Enter the 4-digit pickup PIN from {d.pickup_contact || "the sender"}.
            </div>
            <PinInput value={pickupPin} onChange={setPickupPin} />
          </div>
        )}
        {currentStep === 2 && (
          <RealProofUpload
            label="Real photo of item at pickup"
            proofType="pickup"
            proof={proofs.pickup}
            uploading={uploadingProof === "pickup"}
            onUpload={(file) => uploadProof("pickup", file)}
            onView={() => viewProof("pickup")}
          />
        )}
        {currentStep === 3 && (
          <div className="space-y-3">
            <div className="rounded-xl bg-accent/10 p-4 text-sm">
              <Truck className="mr-2 inline h-4 w-4" />
              Deliver to <b>{d.dropoff_address}</b>. Call {d.dropoff_contact} if
              you need help locating the receiver.
            </div>
            <DeliveryRouteMap
              pickupAddress={d.pickup_address}
              dropoffAddress={d.dropoff_address}
              className="h-56"
            />
          </div>
        )}
        {currentStep === 4 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Enter the 4-digit drop-off PIN from {d.dropoff_contact || "the receiver"}.
              Their number is shown above for a quick call.
            </div>
            <PinInput value={dropoffPin} onChange={setDropoffPin} />
          </div>
        )}
        {currentStep === 5 && (
          <RealProofUpload
            label="Real photo proof of delivery"
            proofType="delivery"
            proof={proofs.delivery}
            uploading={uploadingProof === "delivery"}
            onUpload={(file) => uploadProof("delivery", file)}
            onView={() => viewProof("delivery")}
          />
        )}
        {currentStep === 6 && (
          <div className="flex items-start gap-2 rounded-xl bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            PIN and real delivery photo are ready. Complete the delivery to
            close the job and release the payout workflow.
          </div>
        )}

        <Button
          onClick={() => void advance()}
          className="w-full accent-gradient text-white shadow-glow"
          disabled={
            updateStatus.isPending ||
            uploadingProof !== null ||
            proofsLoading
          }
        >
          {updateStatus.isPending
            ? "Updating..."
            : proofsLoading
              ? "Checking proof..."
              : buttonLabel}
        </Button>
      </div>
    </div>
  );
}
