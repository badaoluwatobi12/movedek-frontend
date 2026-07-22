import { describe, expect, it } from "vitest";
import { resolveVerificationDocumentUrl } from "../verificationDocument.service";

describe("resolveVerificationDocumentUrl", () => {
  it("joins the current relative document route to an API base", () => {
    expect(
      resolveVerificationDocumentUrl(
        "/couriers/documents/document-1/access",
        "https://api.movedek.com/api",
      ),
    ).toBe(
      "https://api.movedek.com/api/couriers/documents/document-1/access",
    );
  });

  it("normalizes legacy responses without creating an /api/api URL", () => {
    expect(
      resolveVerificationDocumentUrl(
        "/api/couriers/documents/document-1/access",
        "https://api.movedek.com/api",
      ),
    ).toBe(
      "https://api.movedek.com/api/couriers/documents/document-1/access",
    );
  });

  it("preserves fully qualified signed or access URLs", () => {
    const url =
      "https://example.r2.cloudflarestorage.com/file?X-Amz-Signature=test";
    expect(
      resolveVerificationDocumentUrl(url, "https://api.movedek.com/api"),
    ).toBe(url);
  });
});
