import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper, UploadPlaceholder, EmptyState } from "@/components/common";
import { toast } from "sonner";
import { store, useSession, useStore } from "@/data/store";
import { ShieldCheck, UserCheck } from "lucide-react";
import type { CourierType } from "@/lib/types";

const steps = ["Profile", "Selfie", "Gov ID", "Vehicle", "License", "Bank", "Emergency", "Review"];
const vehicleTypes: CourierType[] = ["everyday", "motorcycle", "car", "van", "logistics"];

export default function Onboarding() {
  const nav = useNavigate();
  const session = useSession()!;
  const [step, setStep] = useState(0);
  const couriers = useStore((s) => s.couriers);
  const users = useStore((s) => s.users);
  const me = couriers.find((c) => c.user_id === session.userId);
  const user = users.find((u) => u.id === session.userId);

  const [uploads, setUploads] = useState({
    selfie: Boolean(me?.selfie_uploaded),
    id: Boolean(me?.id_uploaded),
    license: Boolean(me?.license_uploaded),
  });
  const [profile, setProfile] = useState({
    fullName: user?.full_name ?? "",
    address: me?.home_address ?? "",
    zones: Array.isArray(me?.service_zones) ? me.service_zones.join(", ") : (me?.service_zones ?? ""),
    vehicleType: me?.courier_type ?? "motorcycle",
    vehicleModel: me?.vehicle_type === "Not added yet" ? "" : (me?.vehicle_type ?? ""),
    plate: me?.plate_number ?? "",
    colour: me?.vehicle_colour ?? "",
    bankName: me?.bank_name === "Not added" ? "" : (me?.bank_name ?? ""),
    accountNumber: me?.account_number === "Not added" ? "" : (me?.account_number ?? ""),
    accountName: me?.account_name ?? user?.full_name ?? "",
    emergencyName: me?.emergency_contact_name ?? "",
    emergencyRelationship: me?.emergency_contact_relationship ?? "",
    emergencyPhone: me?.emergency_contact_phone ?? "",
  });

  if (!me) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Courier profile not found"
        desc="Login with a courier account before completing courier onboarding."
      />
    );
  }

  const validateStep = () => {
    if (step === 0 && (!profile.fullName.trim() || !profile.address.trim() || !profile.zones.trim()))
      return "Complete your name, home address and preferred zones.";
    if (step === 1 && !uploads.selfie) return "Upload or mark your selfie as uploaded.";
    if (step === 2 && !uploads.id) return "Upload or mark your government ID as uploaded.";
    if (step === 3 && (!profile.vehicleType.trim() || !profile.vehicleModel.trim()))
      return "Add your vehicle type and model.";
    if (step === 4 && profile.vehicleType !== "everyday" && !uploads.license)
      return "Upload or mark your driver license as uploaded.";
    if (
      step === 5 &&
      (!profile.bankName.trim() || !profile.accountNumber.trim() || !profile.accountName.trim())
    )
      return "Complete your bank details.";
    if (step === 5 && !/^\d{10}$/.test(profile.accountNumber.trim()))
      return "Enter a valid 10-digit account number.";
    if (step === 6 && (!profile.emergencyName.trim() || !profile.emergencyPhone.trim()))
      return "Add emergency contact name and phone.";
    return "";
  };

  const next = () => {
    const error = validateStep();
    if (error) return toast.error(error);
    setStep(Math.min(steps.length - 1, step + 1));
  };

  const submit = () => {
    const error = validateStep();
    if (error) return toast.error(error);

    store.updateCourier(me.id, {
      courier_type: profile.vehicleType as CourierType,
      vehicle_type: profile.vehicleModel || profile.vehicleType,
      bank_name: profile.bankName,
      account_number: profile.accountNumber,
      account_name: profile.accountName,
      home_address: profile.address,
      service_zones: profile.zones
        .split(",")
        .map((zone) => zone.trim())
        .filter(Boolean),
      plate_number: profile.plate,
      vehicle_colour: profile.colour,
      emergency_contact_name: profile.emergencyName,
      emergency_contact_relationship: profile.emergencyRelationship,
      emergency_contact_phone: profile.emergencyPhone,
      selfie_uploaded: uploads.selfie,
      id_uploaded: uploads.id,
      license_uploaded: uploads.license,
      verification_status: "pending",
      onboarding_submitted_at: new Date().toISOString(),
    });
    store.updateUser(session.userId, { full_name: profile.fullName });
    toast.success("Verification details saved. Your account is now pending admin review.");
    nav("/courier");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Courier onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Complete this form so admin can verify your courier account.
          </p>
        </div>
        <span className="chip bg-muted capitalize">{me.verification_status}</span>
      </div>
      <Stepper steps={steps} current={step} />
      <div className="card-elevated p-6 space-y-4">
        {step === 0 && (
          <>
            <h2 className="font-display font-semibold text-primary">Basic profile</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date of birth</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Home address</Label>
                <Input
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Yaba, Lagos"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Preferred work zones</Label>
                <Input
                  value={profile.zones}
                  onChange={(e) => setProfile({ ...profile, zones: e.target.value })}
                  placeholder="Yaba, VI, Ikeja"
                />
              </div>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="font-display font-semibold text-primary">Selfie verification</h2>
            <p className="text-sm text-muted-foreground">Upload a clear face photo for identity matching.</p>
            <UploadPlaceholder label="Upload selfie" done={uploads.selfie} />
            <Button variant="outline" onClick={() => setUploads({ ...uploads, selfie: true })}>
              Mark selfie uploaded
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-display font-semibold text-primary">Government ID</h2>
            <p className="text-sm text-muted-foreground">
              Use NIN slip, passport, voter card or driver's license.
            </p>
            <UploadPlaceholder label="Upload government ID" done={uploads.id} />
            <Button variant="outline" onClick={() => setUploads({ ...uploads, id: true })}>
              Mark ID uploaded
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="font-display font-semibold text-primary">Vehicle details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Courier type</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={profile.vehicleType}
                  onChange={(e) => setProfile({ ...profile, vehicleType: e.target.value as CourierType })}
                >
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle / movement type</Label>
                <Input
                  value={profile.vehicleModel}
                  onChange={(e) => setProfile({ ...profile, vehicleModel: e.target.value })}
                  placeholder="Bajaj Boxer 125 / Walking / Toyota Corolla"
                />
              </div>
              <div className="space-y-2">
                <Label>Plate number</Label>
                <Input
                  value={profile.plate}
                  onChange={(e) => setProfile({ ...profile, plate: e.target.value })}
                  placeholder="LAG-123-XY"
                />
              </div>
              <div className="space-y-2">
                <Label>Colour</Label>
                <Input
                  value={profile.colour}
                  onChange={(e) => setProfile({ ...profile, colour: e.target.value })}
                  placeholder="Red"
                />
              </div>
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="font-display font-semibold text-primary">Driver's license</h2>
            <p className="text-sm text-muted-foreground">
              Required for motorcycle, car, van and logistics couriers. Everyday walking couriers can continue
              without it.
            </p>
            <UploadPlaceholder label="Upload driver's license" done={uploads.license} />
            <Button variant="outline" onClick={() => setUploads({ ...uploads, license: true })}>
              Mark license uploaded
            </Button>
          </>
        )}
        {step === 5 && (
          <>
            <h2 className="font-display font-semibold text-primary">Bank details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bank name</Label>
                <Input
                  value={profile.bankName}
                  onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                  placeholder="GTBank"
                />
              </div>
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input
                  value={profile.accountNumber}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="0123456789"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Account name</Label>
                <Input
                  value={profile.accountName}
                  onChange={(e) => setProfile({ ...profile, accountName: e.target.value })}
                  placeholder="Account name"
                />
              </div>
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <h2 className="font-display font-semibold text-primary">Emergency contact</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact name</Label>
                <Input
                  value={profile.emergencyName}
                  onChange={(e) => setProfile({ ...profile, emergencyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  value={profile.emergencyRelationship}
                  onChange={(e) => setProfile({ ...profile, emergencyRelationship: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profile.emergencyPhone}
                  onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                />
              </div>
            </div>
          </>
        )}
        {step === 7 && (
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-primary">Review & submit</h2>
            <p className="text-sm text-muted-foreground">
              Submitting places your courier account in pending admin review.
            </p>
            <div className="rounded-xl bg-muted/40 p-4 text-sm space-y-1">
              <div>✓ Profile: {profile.fullName}</div>
              <div>✓ Work zones: {profile.zones}</div>
              <div>✓ Courier type: {profile.vehicleType}</div>
              <div>
                ✓ Bank: {profile.bankName} · {profile.accountNumber}
              </div>
              <div>
                ✓ Documents: selfie {uploads.selfie ? "yes" : "no"}, ID {uploads.id ? "yes" : "no"}, license{" "}
                {uploads.license ? "yes" : "no"}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button className="accent-gradient text-white shadow-glow" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button className="accent-gradient text-white shadow-glow" onClick={submit}>
            <UserCheck className="mr-2 h-4 w-4" />
            Submit for review
          </Button>
        )}
      </div>
    </div>
  );
}
