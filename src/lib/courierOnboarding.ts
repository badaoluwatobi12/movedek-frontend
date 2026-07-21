import type {
  Courier,
  CourierType,
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";

export type CourierOnboardingMode =
  | "draft"
  | "under_review"
  | "approved"
  | "rejected";

export type CourierOnboardingProfile = {
  fullName: string;
  address: string;
  zones: string;
  vehicleType: CourierType;
  vehicleModel: string;
  plate: string;
  colour: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
};

export type DocumentsByType = Partial<
  Record<VerificationDocumentType, VerificationDocument>
>;

export function getCourierOnboardingMode(
  courier: Pick<
    Courier,
    "verification_status" | "onboarding_submitted_at"
  >,
): CourierOnboardingMode {
  if (courier.verification_status === "approved") return "approved";
  if (courier.verification_status === "rejected") return "rejected";
  if (courier.onboarding_submitted_at) return "under_review";
  return "draft";
}

export function isUsableVerificationDocument(
  document: VerificationDocument | undefined,
) {
  return Boolean(document && document.status !== "rejected");
}

export function getFirstIncompleteOnboardingStep(input: {
  profile: CourierOnboardingProfile;
  documents: DocumentsByType;
}) {
  const { profile, documents } = input;

  if (
    !profile.fullName.trim() ||
    !profile.address.trim() ||
    !profile.zones.trim()
  ) {
    return 0;
  }

  if (!isUsableVerificationDocument(documents.selfie)) return 1;
  if (!isUsableVerificationDocument(documents.government_id)) return 2;

  if (
    !profile.vehicleType.trim() ||
    !profile.vehicleModel.trim() ||
    !profile.plate.trim()
  ) {
    return 3;
  }

  if (
    profile.vehicleType !== "everyday" &&
    !isUsableVerificationDocument(documents.driver_license)
  ) {
    return 4;
  }

  if (
    !profile.bankName.trim() ||
    !/^\d{10}$/.test(profile.accountNumber.trim()) ||
    !profile.accountName.trim()
  ) {
    return 5;
  }

  if (!profile.emergencyName.trim() || !profile.emergencyPhone.trim()) {
    return 6;
  }

  return 7;
}

export function courierOnboardingStepKey(userId: string) {
  return `movedek_courier_onboarding_step_${userId}`;
}

