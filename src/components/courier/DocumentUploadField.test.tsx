import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VerificationDocument } from "@/lib/types";
import { DocumentUploadField } from "./DocumentUploadField";

const serviceMocks = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  open: vi.fn(),
}));

vi.mock("@/services/verificationDocument.service", () => ({
  verificationDocumentService: serviceMocks,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const uploadedDocument: VerificationDocument = {
  id: "document-1",
  courierId: "courier-1",
  ownerUserId: "user-1",
  documentType: "selfie",
  provider: "r2",
  resourceType: "image",
  format: "jpg",
  bytes: 91_000,
  width: 640,
  height: 640,
  originalName: "selfie.jpg",
  mimeType: "image/jpeg",
  status: "uploaded",
  rejectionReason: null,
  uploadedAt: "2026-07-22T10:00:00.000Z",
  reviewedAt: null,
  reviewedBy: null,
  createdAt: "2026-07-22T10:00:00.000Z",
  updatedAt: "2026-07-22T10:00:00.000Z",
  accessUrl: "/couriers/documents/document-1/access",
  downloadUrl: "/couriers/documents/document-1/access?download=true",
};

describe("DocumentUploadField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.upload.mockResolvedValue(uploadedDocument);
  });

  it("uploads automatically once after a file is selected", async () => {
    const onChanged = vi.fn();

    render(
      <DocumentUploadField
        label="Selfie"
        description="Upload a clear selfie."
        type="selfie"
        onChanged={onChanged}
      />,
    );

    const file = new File(["selfie"], "selfie.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(screen.getByLabelText("Choose selfie file"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(serviceMocks.upload).toHaveBeenCalledTimes(1);
    });
    expect(serviceMocks.upload).toHaveBeenCalledWith("selfie", file);
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith(uploadedDocument);
    });
  });
});
