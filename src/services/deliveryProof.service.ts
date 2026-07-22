import { API_BASE_URL } from "./apiBase";
import { http } from "./http";

export type DeliveryProofType = "pickup" | "delivery";

export type DeliveryProof = {
  id: string;
  delivery_id: string;
  proof_type: DeliveryProofType;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type DeliveryProofSet = {
  pickup: DeliveryProof | null;
  delivery: DeliveryProof | null;
};

export function resolveDeliveryProofAccessUrl(
  baseUrl: string,
  deliveryId: string,
  proofType: DeliveryProofType,
  download = false,
) {
  const base = baseUrl.replace(/\/+$/, "");
  const query = download ? "?download=true" : "";
  return `${base}/deliveries/${encodeURIComponent(deliveryId)}/proofs/${proofType}/access${query}`;
}

export const deliveryProofService = {
  list: (deliveryId: string) =>
    http<DeliveryProofSet>(`/deliveries/${deliveryId}/proofs`),

  upload: (
    deliveryId: string,
    proofType: DeliveryProofType,
    file: File,
  ) => {
    const body = new FormData();
    body.append("file", file);
    return http<DeliveryProof>(
      `/deliveries/${deliveryId}/proofs/${proofType}`,
      { method: "POST", body },
    );
  },

  accessUrl: (
    deliveryId: string,
    proofType: DeliveryProofType,
    download = false,
  ) => {
    return resolveDeliveryProofAccessUrl(
      API_BASE_URL,
      deliveryId,
      proofType,
      download,
    );
  },
};
