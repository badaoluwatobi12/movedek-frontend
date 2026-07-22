import { describe, expect, it } from "vitest";
import { resolveDeliveryProofAccessUrl } from "../deliveryProof.service";

describe("resolveDeliveryProofAccessUrl", () => {
  it("creates one API prefix for secure pickup proof access", () => {
    expect(
      resolveDeliveryProofAccessUrl(
        "https://api.movedek.com/api/",
        "delivery-1",
        "pickup",
      ),
    ).toBe(
      "https://api.movedek.com/api/deliveries/delivery-1/proofs/pickup/access",
    );
  });

  it("adds the download query for delivery proof", () => {
    expect(
      resolveDeliveryProofAccessUrl(
        "https://api.movedek.com/api",
        "delivery-1",
        "delivery",
        true,
      ),
    ).toBe(
      "https://api.movedek.com/api/deliveries/delivery-1/proofs/delivery/access?download=true",
    );
  });
});
