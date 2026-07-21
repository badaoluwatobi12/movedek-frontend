import { describe, expect, it } from "vitest";
import type {
  Courier,
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";
import {
  getCourierOnboardingMode,
  getFirstIncompleteOnboardingStep,
  isUsableVerificationDocument,
  type CourierOnboardingProfile,
} from "@/lib/courierOnboarding";

const profile: CourierOnboardingProfile = {
  fullName: "Test Courier",
  address: "Yaba, Lagos",
  zones: "Yaba, Ikeja",
  vehicleType: "motorcycle",
  vehicleModel: "Bajaj Boxer",
  plate: "LAG-123-XY",
  colour: "Green",
  bankName: "Test Bank",
  accountNumber: "0123456789",
  accountName: "Test Courier",
  emergencyName: "Test Contact",
  emergencyRelationship: "Sibling",
  emergencyPhone: "08000000000",
};

function document(
  documentType: VerificationDocumentType,
  status: VerificationDocument["status"] = "uploaded",
): VerificationDocument {
  return {
    id: `doc-${documentType}`,
    courierId: "courier-1",
    ownerUserId: "user-1",
    documentType,
    provider: "cloudinary",
    resourceType: "image",
    format: "jpg",
    bytes: 100,
    width: 100,
    height: 100,
    originalName: `${documentType}.jpg`,
    mimeType: "image/jpeg",
    status,
    rejectionReason: status === "rejected" ? "Replace this document" : null,
    uploadedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessUrl: `/api/couriers/documents/doc-${documentType}/access`,
    downloadUrl: `/api/couriers/documents/doc-${documentType}/access?download=true`,
  };
}

const courier = {
  verification_status: "pending",
} as Pick<Courier, "verification_status" | "onboarding_submitted_at">;

describe("courier onboarding state", () => {
  it("keeps approved couriers out of onboarding", () => {
    expect(
      getCourierOnboardingMode({
        ...courier,
        verification_status: "approved",
        onboarding_submitted_at: new Date().toISOString(),
      }),
    ).toBe("approved");
  });

  it("shows a submitted pending application as under review", () => {
    expect(
      getCourierOnboardingMode({
        ...courier,
        onboarding_submitted_at: new Date().toISOString(),
      }),
    ).toBe("under_review");
  });

  it("resumes rejected applications", () => {
    expect(
      getCourierOnboardingMode({
        ...courier,
        verification_status: "rejected",
        onboarding_submitted_at: new Date().toISOString(),
      }),
    ).toBe("rejected");
  });
});

describe("courier onboarding progress", () => {
  it("returns the first missing step", () => {
    expect(
      getFirstIncompleteOnboardingStep({ profile, documents: {} }),
    ).toBe(1);
  });

  it("does not accept a rejected document as complete", () => {
    const rejectedSelfie = document("selfie", "rejected");
    expect(isUsableVerificationDocument(rejectedSelfie)).toBe(false);
    expect(
      getFirstIncompleteOnboardingStep({
        profile,
        documents: {
          selfie: rejectedSelfie,
          government_id: document("government_id"),
          driver_license: document("driver_license"),
        },
      }),
    ).toBe(1);
  });

  it("reaches review when every required step is complete", () => {
    expect(
      getFirstIncompleteOnboardingStep({
        profile,
        documents: {
          selfie: document("selfie"),
          government_id: document("government_id"),
          driver_license: document("driver_license"),
        },
      }),
    ).toBe(7);
  });
});
