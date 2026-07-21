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
import { RiskBadge } from "@/components/badges";
import { useSession, useStore } from "@/data/store";
import { naira, priceEstimate, riskFor } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Utensils,
  ShoppingBasket,
  Pill,
  Package,
  HandHeart,
  Building2,
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
import type { DeliveryCategory, CourierType } from "@/lib/types";
import type { PackageSize } from "@/types/delivery";
import { useCreateDelivery } from "@/hooks/useDeliveries";
import { useInitializePayment } from "@/hooks/usePayments";

const categories: {
  id: DeliveryCategory;
  icon: LucideIcon;
  label: string;
  desc: string;
}[] = [
  { id: "food", icon: Utensils, label: "Food", desc: "Meals, takeout" },
  {
    id: "groceries",
    icon: ShoppingBasket,
    label: "Groceries",
    desc: "Market runs",
  },
  {
    id: "pharmacy",
    icon: Pill,
    label: "Pharmacy",
    desc: "Legal pharmacy pickup",
  },
  {
    id: "parcel",
    icon: Package,
    label: "Parcel",
    desc: "Packages and documents",
  },
  {
    id: "personal_pickup",
    icon: HandHeart,
    label: "Personal Pickup",
    desc: "Forgotten items",
  },
  {
    id: "business",
    icon: Building2,
    label: "Business Delivery",
    desc: "Bulk / commercial",
  },
];

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
  "Category",
  "Pickup",
  "Drop-off",
  "Package",
  "Courier",
  "Review",
  "Confirm",
];

const stepFields: (keyof CreateDeliveryInput)[][] = [
  ["category"],
  ["pickup_address", "pickup_contact", "pickup_phone"],
  ["dropoff_address", "dropoff_contact", "dropoff_phone", "distance_km"],
  ["item_name", "item_value", "package_size"],
  ["courier_type"],
  [],
  [],
];

export default function CreateDelivery() {
  const navigate = useNavigate();
  const session = useSession()!;
  const wallets = useStore((s) => s.wallets);
  const savedAddresses = useStore((s) => s.savedAddresses);
  const settings = useStore((s) => s.settings);
  const wallet = wallets.find((w) => w.user_id === session.userId);
  const myAddresses = savedAddresses.filter(
    (a) => a.user_id === session.userId,
  );
  const enabledCategories = categories.filter(
    (c) => settings.categories[c.id] !== false,
  );

  const [step, setStep] = useState(0);
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
      category: enabledCategories[0]?.id ?? "food",
      pickup_address: "",
      pickup_contact: "",
      pickup_phone: "",
      pickup_notes: "",
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
      distance_km: 5,
    },
  });

  const data = watch();

  const price = useMemo(
    () => priceEstimate(data.distance_km, data.protection, data.courier_type),
    [data.distance_km, data.protection, data.courier_type],
  );
  const risk = riskFor(data.item_value);
  const balance = wallet?.balance ?? 0;
  const hasEnoughBalance = balance >= price.total;

  const fillPickup = (address: string) =>
    setValue("pickup_address", address, { shouldValidate: true });
  const fillDropoff = (address: string) =>
    setValue("dropoff_address", address, { shouldValidate: true });

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const goNext = async () => {
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
        category: input.category,
        pickup_address: input.pickup_address.trim(),
        pickup_contact: input.pickup_contact.trim(),
        pickup_phone: input.pickup_phone.trim(),
        pickup_notes: input.pickup_notes?.trim() || undefined,
        dropoff_address: input.dropoff_address.trim(),
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
        price: price.total,
        courier_payout: Math.round(price.total * 0.78),
        distance_km: input.distance_km,
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
          <div>
            <h2 className="font-display text-lg font-semibold text-primary">
              What are you sending?
            </h2>
            {enabledCategories.length === 0 ? (
              <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
                No delivery categories are enabled yet. Ask an admin to enable
                at least one category.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {enabledCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setValue("category", c.id, { shouldValidate: true })
                    }
                    className={cn(
                      "card-soft p-4 text-left transition hover:border-accent",
                      data.category === c.id &&
                        "border-accent ring-2 ring-accent/30",
                    )}
                  >
                    <c.icon className="h-6 w-6 text-accent" />
                    <div className="mt-3 font-medium text-primary">
                      {c.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Pickup details
            </h2>
            {myAddresses.length > 0 && (
              <AddressShortcuts
                title="Use saved pickup address"
                addresses={myAddresses}
                onPick={fillPickup}
              />
            )}
            <div className="space-y-2">
              <Label>Pickup address</Label>
              <Input
                {...register("pickup_address")}
                placeholder="Street, area, city"
              />
              {errors.pickup_address && (
                <FieldError message={errors.pickup_address.message} />
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact name</Label>
                <Input
                  {...register("pickup_contact")}
                  placeholder="Who to meet"
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
              <Label>Notes for pickup (optional)</Label>
              <Textarea
                {...register("pickup_notes")}
                placeholder="Gate code, landmarks…"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Drop-off details
            </h2>
            {myAddresses.length > 0 && (
              <AddressShortcuts
                title="Use saved drop-off address"
                addresses={myAddresses}
                onPick={fillDropoff}
              />
            )}
            <div className="space-y-2">
              <Label>Drop-off address</Label>
              <Input
                {...register("dropoff_address")}
                placeholder="Street, area, city"
              />
              {errors.dropoff_address && (
                <FieldError message={errors.dropoff_address.message} />
              )}
            </div>
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
                <Input {...register("dropoff_phone")} />
                {errors.dropoff_phone && (
                  <FieldError message={errors.dropoff_phone.message} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estimated distance in km</Label>
              <Input
                type="number"
                min={0.1}
                step={0.5}
                {...register("distance_km", { valueAsNumber: true })}
              />
              {errors.distance_km && (
                <FieldError message={errors.distance_km.message} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Drop-off notes (optional)</Label>
              <Textarea {...register("dropoff_notes")} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Package details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Item name</Label>
                <Input
                  {...register("item_name")}
                  placeholder="Documents, food, medicine…"
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
              <Label>Package size</Label>
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
                <b>Prohibited items:</b> illegal substances, firearms, hazardous
                materials, stolen goods, or anything restricted by Nigerian law.
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
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
                  Cover eligible declared value · +₦300
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

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Review your request
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Category" value={data.category.replace("_", " ")} />
              <Info label="Courier" value={data.courier_type} />
              <Info label="Item" value={data.item_name || "—"} />
              <Info label="Value" value={naira(data.item_value)} />
              <Info label="Distance" value={`${data.distance_km} km`} />
              <Info label="Risk" value={risk} />
            </div>
            <div className="card-soft p-4 space-y-2 text-sm">
              <Row label="Base fare" value={naira(price.base)} />
              <Row label="Distance fee" value={naira(price.distance)} />
              <Row label="Service fee" value={naira(price.service)} />
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

        {step === 6 && (
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
            disabled={enabledCategories.length === 0}
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
