import type {
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";
import { API_BASE_URL } from "./apiBase";
import { http } from "./http";

function absolute(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const verificationDocumentService = {
  listOwn: () => http<VerificationDocument[]>("/couriers/documents/me"),

  listForCourier: (courierId: string) =>
    http<VerificationDocument[]>(
      `/couriers/documents/courier/${encodeURIComponent(courierId)}`,
    ),

  upload: async (type: VerificationDocumentType, file: File) => {
    const form = new FormData();
    form.set("document", file);
    return http<VerificationDocument>(
      `/couriers/documents/me/${encodeURIComponent(type)}`,
      { method: "POST", body: form },
    );
  },

  remove: (id: string) =>
    http<{ deleted: boolean }>(
      `/couriers/documents/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),

  open: (document: VerificationDocument, download = false) => {
    const path = download ? document.downloadUrl : document.accessUrl;
    window.open(absolute(path), "_blank", "noopener,noreferrer");
  },
};
