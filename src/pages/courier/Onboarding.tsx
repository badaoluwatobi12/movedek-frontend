import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper, EmptyState } from "@/components/common";
import { DocumentUploadField } from "@/components/courier/DocumentUploadField";
import { store, useSession, useStore } from "@/data/store";
import type {
  CourierType,
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";
import { http } from "@/services/http";
import { verificationDocumentService } from "@/services/verificationDocument.service";

const steps = [
  "Profile",
  "Selfie",
  "Gov ID",
  "Vehicle",
  "License",
  "Bank",
  "Emergency",
  "Review",
];

const vehicleTypes: CourierType[] = [
  "everyday",
  "motorcycle",
  "car",
  "van",
  "logistics",
];

export default function Onboarding() {
  const nav = useNavigate();
  const session = useSession()!;
  const [step, setStep] = useState(0);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const couriers = useStore((state) => state.couriers);
  const users = useStore((state) => state.users);
  const me = couriers.find((courier) => courier.user_id === session.userId);
  const user = users.find((candidate) => candidate.id === session.userId);

  const [profile, setProfile] = useState({
    fullName: user?.full_name ?? "",
    address: me?.home_address ?? "",
    zones: Array.isArray(me?.service_zones)
      ? me.service_zones.join(", ")
      : (me?.service_zones ?? ""),
    vehicleType: me?.courier_type ?? ("motorcycle" as CourierType),
    vehicleModel:
      me?.vehicle_type === "Not added yet" ? "" : (me?.vehicle_type ?? ""),
    plate: me?.plate_number ?? "",
    colour: me?.vehicle_colour ?? "",
    bankName: me?.bank_name === "Not added" ? "" : (me?.bank_name ?? ""),
    accountNumber:
      me?.account_number === "Not added" ? "" : (me?.account_number ?? ""),
    accountName: me?.account_name ?? user?.full_name ?? "",
    emergencyName: me?.emergency_contact_name ?? "",
    emergencyRelationship: me?.emergency_contact_relationship ?? "",
    emergencyPhone: me?.emergency_contact_phone ?? "",
  });

  const reloadDocuments = useCallback(async () => {
    try {
      setDocumentsLoading(true);
      setDocuments(await verificationDocumentService.listOwn());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load verification documents.",
      );
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadDocuments();
  }, [reloadDocuments]);

  const documentByType = useMemo(
    () =>
      Object.fromEntries(
        documents.map((document) => [document.documentType, document]),
      ) as Partial<Record<VerificationDocumentType, VerificationDocument>>,
    [documents],
  );

  if (!me) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Courier profile not found"
        desc="Login with a courier account before completing courier onboarding."
      />
    );
  }

  const licenseRequired = profile.vehicleType !== "everyday";

  const validateStep = () => {
    if (
      step === 0 &&
      (!profile.fullName.trim() ||
        !profile.address.trim() ||
        !profile.zones.trim())
    ) {
      return "Complete your name, home address, and preferred zones.";
    }
    if (step === 1 && !documentByType.selfie) {
      return "Upload a real selfie before continuing.";
    }
    if (step === 2 && !documentByType.government_id) {
      return "Upload a real government ID before continuing.";
    }
    if (
      step === 3 &&
      (!profile.vehicleType.trim() ||
        !profile.vehicleModel.trim() ||
        !profile.plate.trim())
    ) {
      return "Add your courier type, movement or vehicle type, and plate or identifier.";
    }
    if (step === 4 && licenseRequired && !documentByType.driver_license) {
      return "Upload a driver licence for this courier type.";
    }
    if (
      step === 5 &&
      (!profile.bankName.trim() ||
        !profile.accountNumber.trim() ||
        !profile.accountName.trim())
    ) {
      return "Complete your bank details.";
    }
    if (step === 5 && !/^\d{10}$/.test(profile.accountNumber.trim())) {
      return "Enter a valid 10-digit account number.";
    }
    if (
      step === 6 &&
      (!profile.emergencyName.trim() || !profile.emergencyPhone.trim())
    ) {
      return "Add an emergency contact name and phone number.";
    }
    return "";
  };

  const next = () => {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const submit = async () => {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    if (!documentByType.selfie || !documentByType.government_id) {
      toast.error("Upload all required verification documents.");
      return;
    }
    if (licenseRequired && !documentByType.driver_license) {
      toast.error("A driver licence is required for this courier type.");
      return;
    }

    setSubmitting(true);
    try {
      await http("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name: profile.fullName.trim() }),
      });
      await http(`/couriers/${encodeURIComponent(me.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          courier_type: profile.vehicleType,
          vehicle_type: profile.vehicleModel.trim(),
          bank_name: profile.bankName.trim(),
          account_number: profile.accountNumber.trim(),
          account_name: profile.accountName.trim(),
          home_address: profile.address.trim(),
          service_zones: profile.zones
            .split(",")
            .map((zone) => zone.trim())
            .filter(Boolean),
          plate_number: profile.plate.trim(),
          vehicle_colour: profile.colour.trim(),
          emergency_contact_name: profile.emergencyName.trim(),
          emergency_contact_relationship: profile.emergencyRelationship.trim(),
          emergency_contact_phone: profile.emergencyPhone.trim(),
          onboarding_submitted_at: new Date().toISOString(),
        }),
      });
      await store.refresh();
      toast.success(
        "Your profile and real documents were submitted for admin review.",
      );
      nav("/courier");
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit your courier application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Courier onboarding
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete your profile and upload real verification documents for
            private admin review.
          </p>
        </div>
        <span className="chip bg-muted capitalize">
          {me.verification_status}
        </span>
      </div>

      <Stepper steps={steps} current={step} />

      <div className="card-elevated space-y-4 p-6">
        {step === 0 && (
          <>
            <h2 className="font-display font-semibold text-primary">
              Basic profile
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={profile.fullName}
                  onChange={(event) =>
                    setProfile({ ...profile, fullName: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Home address</Label>
                <Input
                  value={profile.address}
                  onChange={(event) =>
                    setProfile({ ...profile, address: event.target.value })
                  }
                  placeholder="Yaba, Lagos"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Preferred work zones</Label>
                <Input
                  value={profile.zones}
                  onChange={(event) =>
                    setProfile({ ...profile, zones: event.target.value })
                  }
                  placeholder="Yaba, VI, Ikeja"
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <DocumentUploadField
            label="Selfie"
            description="Upload a clear, recent face photo. Images only are recommended."
            type="selfie"
            document={documentByType.selfie}
            onChanged={async () => {
              await reloadDocuments();
              await store.refresh();
            }}
          />
        )}

        {step === 2 && (
          <DocumentUploadField
            label="Government ID"
            description="Upload a readable NIN slip, passport, voter card, or another government-issued ID."
            type="government_id"
            document={documentByType.government_id}
            onChanged={async () => {
              await reloadDocuments();
              await store.refresh();
            }}
          />
        )}

        {step === 3 && (
          <>
            <h2 className="font-display font-semibold text-primary">
              Vehicle details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Courier type</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={profile.vehicleType}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      vehicleType: event.target.value as CourierType,
                    })
                  }
                >
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle or movement type</Label>
                <Input
                  value={profile.vehicleModel}
                  onChange={(event) =>
                    setProfile({ ...profile, vehicleModel: event.target.value })
                  }
                  placeholder="Walking, Bajaj Boxer 125, Toyota Corolla"
                />
              </div>
              <div className="space-y-2">
                <Label>Plate number or identifier</Label>
                <Input
                  value={profile.plate}
                  onChange={(event) =>
                    setProfile({ ...profile, plate: event.target.value })
                  }
                  placeholder="LAG-123-XY or WALK-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Colour</Label>
                <Input
                  value={profile.colour}
                  onChange={(event) =>
                    setProfile({ ...profile, colour: event.target.value })
                  }
                  placeholder="Red"
                />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <DocumentUploadField
            label="Driver licence"
            description={
              licenseRequired
                ? "Required for motorcycle, car, van, and logistics couriers."
                : "Everyday walking couriers may skip this document."
            }
            type="driver_license"
            document={documentByType.driver_license}
            optional={!licenseRequired}
            onChanged={async () => {
              await reloadDocuments();
              await store.refresh();
            }}
          />
        )}

        {step === 5 && (
          <>
            <h2 className="font-display font-semibold text-primary">
              Bank details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bank name</Label>
                <Input
                  value={profile.bankName}
                  onChange={(event) =>
                    setProfile({ ...profile, bankName: event.target.value })
                  }
                  placeholder="GTBank"
                />
              </div>
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input
                  value={profile.accountNumber}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      accountNumber: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    })
                  }
                  placeholder="0123456789"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Account name</Label>
                <Input
                  value={profile.accountName}
                  onChange={(event) =>
                    setProfile({ ...profile, accountName: event.target.value })
                  }
                  placeholder="Account name"
                />
              </div>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h2 className="font-display font-semibold text-primary">
              Emergency contact
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact name</Label>
                <Input
                  value={profile.emergencyName}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      emergencyName: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  value={profile.emergencyRelationship}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      emergencyRelationship: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profile.emergencyPhone}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      emergencyPhone: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        {step === 7 && (
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-primary">
              Review and submit
            </h2>
            <p className="text-sm text-muted-foreground">
              Admins can view these documents through authenticated, temporary
              access only. Replacing a document returns the application to
              pending review.
            </p>
            <div className="space-y-1 rounded-xl bg-muted/40 p-4 text-sm">
              <div>✓ Profile: {profile.fullName}</div>
              <div>✓ Work zones: {profile.zones}</div>
              <div>✓ Courier type: {profile.vehicleType}</div>
              <div>
                ✓ Bank: {profile.bankName} · {profile.accountNumber}
              </div>
              <div>
                {documentByType.selfie ? "✓" : "✗"} Selfie ·{" "}
                {documentByType.government_id ? "✓" : "✗"} Government ID ·{" "}
                {documentByType.driver_license
                  ? "✓ Driver licence"
                  : licenseRequired
                    ? "✗ Driver licence"
                    : "Driver licence optional"}
              </div>
              {documentsLoading && (
                <div className="text-muted-foreground">Checking documents…</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || submitting}
        >
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button
            className="accent-gradient text-white shadow-glow"
            onClick={next}
            disabled={documentsLoading}
          >
            Continue
          </Button>
        ) : (
          <Button
            className="accent-gradient text-white shadow-glow"
            onClick={submit}
            disabled={submitting || documentsLoading}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        )}
      </div>
    </div>
  );
}
