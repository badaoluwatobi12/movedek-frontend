import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDeliverySchema, type CreateDeliveryInput } from "@/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Stepper } from "@/components/common";
import { LocationPinPicker } from "@/components/common/LocationPinPicker";
import { RiskBadge } from "@/components/badges";
import { useSession, useStore } from "@/data/store";
import { naira, priceEstimate, riskFor } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Package,
  Users,
  Bike,
  Car,
  Truck,
  Zap,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  MapPin,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CourierType } from "@/lib/types";
import type { PackageSize } from "@/types/delivery";
import { useCreateDelivery } from "@/hooks/useDeliveries";
import { useInitializePayment } from "@/hooks/usePayments";

const courierOptions: {
  id: CourierType;
  icon: LucideIcon;
  label: string;
  desc: string;
}[] = [
  {
    id: "everyday",
    icon: Users,
    label: "Everyday Courier",
    desc: "Light items · public transit",
  },
  {
    id: "motorcycle",
    icon: Bike,
    label: "Motorcycle Rider",
    desc: "Fast city delivery",
  },
  {
    id: "car",
    icon: Car,
    label: "Car Courier",
    desc: "Medium loads and rain cover",
  },
  { id: "van", icon: Truck, label: "Van Courier", desc: "Large packages" },
  {
    id: "logistics",
    icon: Zap,
    label: "Logistics Partner",
    desc: "Business scale",
  },
];

const steps = [
  "Item",
  "Pickup",
  "Drop-off",
  "Courier",
  "Review",
  "Confirm",
];

const stepFields: (keyof CreateDeliveryInput)[][] = [
  ["item_name", "item_value", "package_size"],
  [
    "pickup_area",
    "pickup_landmark",
    "pickup_latitude",
    "pickup_longitude",
    "pickup_contact",
    "pickup_phone",
  ],
  [
    "dropoff_area",
    "dropoff_landmark",
    "dropoff_latitude",
    "dropoff_longitude",
    "dropoff_contact",
    "dropoff_phone",
  ],
  ["courier_type"],
  [],
  [],
];

export default function CreateDelivery() {
  const navigate = useNavigate();
  const session = useSession()!;
  const wallets = useStore((s) => s.wallets);
  const savedAddresses = useStore((s) => s.savedAddresses);
  const pricingSettings = useStore((s) => s.settings.pricing);
  const wallet = wallets.find((w) => w.user_id === session.userId);
  const myAddresses = savedAddresses.filter(
    (a) => a.user_id === session.userId,
  );

  const [step, setStep] = useState(0);
  const [legalItemConfirmed, setLegalItemConfirmed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "saving" | "created">("idle");
  const createDelivery = useCreateDelivery();
  const initializePayment = useInitializePayment();

  const {
    register,
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDeliveryInput>({
    resolver: zodResolver(createDeliverySchema),
    mode: "onChange",
    defaultValues: {
      category: "general",
      pickup_area: "",
      pickup_landmark: "",
      pickup_address: "",
      pickup_contact: "",
      pickup_phone: "",
      pickup_notes: "",
      dropoff_area: "",
      dropoff_landmark: "",
      dropoff_address: "",
      dropoff_contact: "",
      dropoff_phone: "",
      dropoff_notes: "",
      item_name: "",
      item_value: 5000,
      package_size: "small",
      fragile: false,
      delivery_notes: "",
      courier_type: "motorcycle",
      protection: false,
    },
  });

  const data = watch();

  const price = useMemo(
    () =>
      priceEstimate({
        pickup: {
          area: data.pickup_area ?? "",
          latitude: Number(data.pickup_latitude ?? 6.5244),
          longitude: Number(data.pickup_longitude ?? 3.3792),
        },
        dropoff: {
          area: data.dropoff_area ?? "",
          latitude: Number(data.dropoff_latitude ?? 6.5244),
          longitude: Number(data.dropoff_longitude ?? 3.3792),
        },
        protection: data.protection,
        zoneFares: pricingSettings.zone_fares,
        protectionFee: pricingSettings.protection_fee,
      }),
    [
      data.dropoff_area,
      data.dropoff_latitude,
      data.dropoff_longitude,
      data.pickup_area,
      data.pickup_latitude,
      data.pickup_longitude,
      data.protection,
      pricingSettings.protection_fee,
      pricingSettings.zone_fares,
    ],
  );
  const risk = riskFor(data.item_value);
  const balance = wallet?.balance ?? 0;
  const hasEnoughBalance = balance >= price.total;

  const fillPickup = (address: string) => {
    setValue("pickup_address", address, { shouldValidate: true });
    if (!data.pickup_area?.trim()) {
      setValue("pickup_area", address.split(",")[0] ?? address, {
        shouldValidate: true,
      });
    }
  };
  const fillDropoff = (address: string) => {
    setValue("dropoff_address", address, { shouldValidate: true });
    if (!data.dropoff_area?.trim()) {
      setValue("dropoff_area", address.split(",")[0] ?? address, {
        shouldValidate: true,
      });
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const goNext = async () => {
    if (step === 0 && !legalItemConfirmed) {
      toast.error("Confirm that the item is legal and permitted before continuing.");
      return;
    }
    const fields = stepFields[step] ?? [];
    const valid = fields.length === 0 || (await trigger(fields));
    if (!valid) {
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submitDelivery = handleSubmit(async (input) => {
    setPhase("saving");
    try {
      const delivery = await createDelivery.mutateAsync({
        customer_id: session.userId,
        category: "general",
        pickup_area: input.pickup_area.trim(),
        pickup_landmark: input.pickup_landmark.trim(),
        pickup_address: input.pickup_address?.trim() || undefined,
        pickup_latitude: input.pickup_latitude,
        pickup_longitude: input.pickup_longitude,
        pickup_contact: input.pickup_contact.trim(),
        pickup_phone: input.pickup_phone.trim(),
        pickup_notes: input.pickup_notes?.trim() || undefined,
        dropoff_area: input.dropoff_area.trim(),
        dropoff_landmark: input.dropoff_landmark.trim(),
        dropoff_address: input.dropoff_address?.trim() || undefined,
        dropoff_latitude: input.dropoff_latitude,
        dropoff_longitude: input.dropoff_longitude,
        dropoff_contact: input.dropoff_contact.trim(),
        dropoff_phone: input.dropoff_phone.trim(),
        dropoff_notes: input.dropoff_notes?.trim() || undefined,
        item_name: input.item_name.trim() || "Package",
        item_value: input.item_value,
        package_size: input.package_size as PackageSize,
        fragile: input.fragile,
        delivery_notes: input.delivery_notes?.trim() || undefined,
        courier_type: input.courier_type,
        protection: input.protection,
      });
      const payment = await initializePayment.mutateAsync({
        delivery_id: delivery.id,
        provider: hasEnoughBalance ? "wallet" : "paystack",
      });

      if (payment.authorization_url) {
        toast.success(
          "Delivery created. Redirecting to secure Paystack payment.",
        );
        window.location.assign(payment.authorization_url);
        return;
      }

      setPhase("created");
      toast.success("Delivery created and payment is held safely in escrow.");
      window.setTimeout(() => navigate(`/app/track/${delivery.id}`), 900);
    } catch (error) {
      setPhase("idle");
      toast.error(
        error instanceof Error ? error.message : "Could not create delivery",
      );
    }
  });

  if (phase === "saving" || phase === "created") {
    return (
      <div className="card-elevated mx-auto max-w-lg p-5 text-center sm:p-8">
        {phase === "saving" ? (
          <>
            <div className="relative mx-auto h-20 w-20">
              <span className="absolute inset-0 rounded-full bg-accent/40 animate-pulse-ring" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full accent-gradient text-white shadow-glow">
                <Loader2 className="h-8 w-8 animate-spin" />
              </span>
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-primary">
              Saving your request…
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your request is being saved and the payment is being prepared for
              escrow.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-success-foreground shadow-glow">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-primary">
              Delivery created
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Payment is held in escrow. Taking you to tracking while we find a
              courier.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">
          Create a delivery
        </h1>
        <div className="text-sm text-muted-foreground">
          Step {step + 1} of {steps.length}
        </div>
      </div>
      <Stepper steps={steps} current={step} />

      <div className="card-elevated p-4 sm:p-5 md:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              What are you sending?
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Describe the item</Label>
                <Input
                  {...register("item_name")}
                  placeholder="For example: documents, clothes, flowers, groceries, laptop"
                />
                {errors.item_name && (
                  <FieldError message={errors.item_name.message} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Declared item value (₦)</Label>
                <Input
                  type="number"
                  min={0}
                  {...register("item_value", { valueAsNumber: true })}
                />
                {errors.item_value && (
                  <FieldError message={errors.item_value.message} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Approximate size</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["small", "medium", "large", "xl"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setValue("package_size", s, { shouldValidate: true })
                    }
                    className={cn(
                      "rounded-lg border p-2 text-sm capitalize",
                      data.package_size === s
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
              <div>
                <div className="text-sm font-medium">Fragile</div>
                <div className="text-xs text-muted-foreground">
                  Handle with care
                </div>
              </div>
              <Switch
                checked={data.fragile}
                onCheckedChange={(v) =>
                  setValue("fragile", v, { shouldValidate: true })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery notes (optional)</Label>
              <Textarea
                {...register("delivery_notes")}
                placeholder="Anything the courier should know"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Auto risk level:</span> <RiskBadge risk={risk} />
            </div>
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground flex gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <b>Prohibited items:</b> illegal drugs, weapons, explosives, hazardous materials, stolen goods, counterfeit goods, or anything restricted by applicable law.
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-emerald-600"
                checked={legalItemConfirmed}
                onChange={(event) => setLegalItemConfirmed(event.target.checked)}
              />
              <span>
                I confirm this item is legal, safely packaged, and permitted under MoveDek's delivery policy.
              </span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Pickup details
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell the rider the area and nearest landmark, then place the map pin.
                A formal street address is optional.
              </p>
            </div>
            {myAddresses.length > 0 && (
              <AddressShortcuts
                title="Use a saved pickup location"
                addresses={myAddresses}
                onPick={fillPickup}
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Area or neighbourhood</Label>
                <Input
                  {...register("pickup_area")}
                  placeholder="For example: Ikeja, Yaba, Lekki Phase 1"
                />
                {errors.pickup_area && (
                  <FieldError message={errors.pickup_area.message} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Nearest landmark</Label>
                <Input
                  {...register("pickup_landmark")}
                  placeholder="For example: opposite Shoprite or Allen roundabout"
                />
                {errors.pickup_landmark && (
                  <FieldError message={errors.pickup_landmark.message} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Street, estate or building details (optional)</Label>
              <Input
                {...register("pickup_address")}
                placeholder="House number, street, estate, gate or building"
              />
              <p className="text-xs text-muted-foreground">
                Leave this blank when the map cannot find the written address.
              </p>
            </div>
            <LocationPinPicker
              label="Choose the pickup point on the map"
              value={
                Number.isFinite(data.pickup_latitude) &&
                Number.isFinite(data.pickup_longitude)
                  ? {
                      latitude: Number(data.pickup_latitude),
                      longitude: Number(data.pickup_longitude),
                    }
                  : null
              }
              onChange={(pin) => {
                setValue("pickup_latitude", pin.latitude, {
                  shouldValidate: true,
                });
                setValue("pickup_longitude", pin.longitude, {
                  shouldValidate: true,
                });
              }}
            />
            {(errors.pickup_latitude || errors.pickup_longitude) && (
              <FieldError message="Select the pickup point on the map." />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact name</Label>
                <Input
                  {...register("pickup_contact")}
                  placeholder="Who should the rider meet?"
                />
                {errors.pickup_contact && (
                  <FieldError message={errors.pickup_contact.message} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Contact phone</Label>
                <Input {...register("pickup_phone")} placeholder="+234…" />
                {errors.pickup_phone && (
                  <FieldError message={errors.pickup_phone.message} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Additional directions (optional)</Label>
              <Textarea
                {...register("pickup_notes")}
                placeholder="For example: enter through Gate 2 and call on arrival"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Drop-off details
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the receiver's area, nearest landmark and exact map pin.
              </p>
            </div>
            {myAddresses.length > 0 && (
              <AddressShortcuts
                title="Use a saved drop-off location"
                addresses={myAddresses}
                onPick={fillDropoff}
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Area or neighbourhood</Label>
                <Input
                  {...register("dropoff_area")}
                  placeholder="For example: Maryland, Surulere, Victoria Island"
                />
                {errors.dropoff_area && (
                  <FieldError message={errors.dropoff_area.message} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Nearest landmark</Label>
                <Input
                  {...register("dropoff_landmark")}
                  placeholder="For example: mall entrance, bus stop or filling station"
                />
                {errors.dropoff_landmark && (
                  <FieldError message={errors.dropoff_landmark.message} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Street, estate or building details (optional)</Label>
              <Input
                {...register("dropoff_address")}
                placeholder="House number, street, estate, gate or building"
              />
            </div>
            <LocationPinPicker
              label="Choose the drop-off point on the map"
              value={
                Number.isFinite(data.dropoff_latitude) &&
                Number.isFinite(data.dropoff_longitude)
                  ? {
                      latitude: Number(data.dropoff_latitude),
                      longitude: Number(data.dropoff_longitude),
                    }
                  : null
              }
              onChange={(pin) => {
                setValue("dropoff_latitude", pin.latitude, {
                  shouldValidate: true,
                });
                setValue("dropoff_longitude", pin.longitude, {
                  shouldValidate: true,
                });
              }}
            />
            {(errors.dropoff_latitude || errors.dropoff_longitude) && (
              <FieldError message="Select the drop-off point on the map." />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Receiver name</Label>
                <Input {...register("dropoff_contact")} />
                {errors.dropoff_contact && (
                  <FieldError message={errors.dropoff_contact.message} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Receiver phone</Label>
                <Input {...register("dropoff_phone")} placeholder="+234…" />
                {errors.dropoff_phone && (
                  <FieldError message={errors.dropoff_phone.message} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Additional directions (optional)</Label>
              <Textarea
                {...register("dropoff_notes")}
                placeholder="For example: call at the estate gate"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Choose courier type
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {courierOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setValue("courier_type", c.id, { shouldValidate: true })
                  }
                  className={cn(
                    "card-soft p-4 text-left transition hover:border-accent",
                    data.courier_type === c.id &&
                      "border-accent ring-2 ring-accent/30",
                  )}
                >
                  <c.icon className="h-6 w-6 text-accent" />
                  <div className="mt-3 font-medium text-primary">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
              <div>
                <div className="text-sm font-medium">Delivery protection</div>
                <div className="text-xs text-muted-foreground">
                  Cover eligible declared value · +{naira(pricingSettings.protection_fee)}
                </div>
              </div>
              <Switch
                checked={data.protection}
                onCheckedChange={(v) =>
                  setValue("protection", v, { shouldValidate: true })
                }
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Review your request
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Courier" value={data.courier_type} />
              <Info label="Item" value={data.item_name || "—"} />
              <Info label="Value" value={naira(data.item_value)} />
              <Info label="Delivery zone" value={price.zoneLabel} />
              <Info label="Risk" value={risk} />
              <Info
                label="Pickup"
                value={`${data.pickup_landmark || "—"}, ${data.pickup_area || "—"}`}
              />
              <Info
                label="Drop-off"
                value={`${data.dropoff_landmark || "—"}, ${data.dropoff_area || "—"}`}
              />
            </div>
            <div className="card-soft p-4 space-y-2 text-sm">
              <Row label={price.zoneLabel} value={naira(price.zoneFare)} />
              <p className="pb-1 text-xs text-muted-foreground">
                {price.zoneDescription}
              </p>
              {price.protection > 0 && (
                <Row
                  label="Delivery protection"
                  value={naira(price.protection)}
                />
              )}
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-primary">
                <span>Total</span>
                <span>{naira(price.total)}</span>
              </div>
            </div>
            <div className="rounded-xl bg-success/10 p-3 text-sm text-success flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5" /> Your delivery starts as
              pending. It becomes visible to couriers only after payment is held
              in escrow.
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-center">
            <h2 className="font-display text-lg font-semibold text-primary">
              Confirm delivery request
            </h2>
            <p className="text-sm text-muted-foreground">
              Review the delivery fee and pay into escrow before the job is sent
              to couriers.
            </p>
            <div className="card-soft mx-auto max-w-sm p-4 text-left">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" /> Current wallet balance
              </div>
              <div className="font-display text-3xl font-bold text-primary">
                {naira(balance)}
              </div>
              <div className="mt-4 rounded-xl bg-muted/40 p-3">
                <Row label="Delivery total" value={naira(price.total)} />
                <Row
                  label="Payment status"
                  value={
                    hasEnoughBalance
                      ? "Wallet escrow will be used"
                      : "Paystack card payment required"
                  }
                />
              </div>
              {!hasEnoughBalance && (
                <div className="mt-3 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground">
                  Wallet balance is lower than the delivery fee. MoveDek will
                  try to initialize a secure Paystack payment instead.
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              {!hasEnoughBalance && (
                <Link to="/app/wallet">
                  <Button variant="outline">Top up wallet</Button>
                </Link>
              )}
              <Button
                disabled={
                  createDelivery.isPending || initializePayment.isPending
                }
                onClick={submitDelivery}
                className="accent-gradient text-white shadow-glow"
              >
                {createDelivery.isPending || initializePayment.isPending
                  ? "Processing…"
                  : `${hasEnoughBalance ? "Create & hold escrow" : "Create & pay with card"} · ${naira(price.total)}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          Back
        </Button>
        {step < steps.length - 1 && (
          <Button
            onClick={goNext}
            className="accent-gradient text-white shadow-glow"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function AddressShortcuts({
  title,
  addresses,
  onPick,
}: {
  title: string;
  addresses: { id: string; label: string; address: string }[];
  onPick: (address: string) => void;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {addresses.slice(0, 5).map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a.address)}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-accent hover:text-accent"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="card-soft p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-0.5 font-medium text-primary capitalize">{value}</div>
  </div>
);
const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span>{value}</span>
  </div>
);
const FieldError = ({ message }: { message?: string }) => (
  <p className="text-xs font-medium text-destructive">{message}</p>
);
