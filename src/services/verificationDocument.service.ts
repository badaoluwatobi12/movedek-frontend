import type {
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";
import { API_BASE_URL } from "./apiBase";
import { http } from "./http";

export function resolveVerificationDocumentUrl(
  path: string,
  apiBaseUrl = API_BASE_URL,
) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedBaseUrl = apiBaseUrl.trim().replace(/\/+$/, "");
  let normalizedPath = `/${path.trim().replace(/^\/+/, "")}`;

  // The API base already ends in /api in production. Older backend responses
  // also included /api, which produced invalid /api/api document links.
  if (
    /\/api$/i.test(normalizedBaseUrl) &&
    /^\/api(?:\/|$)/i.test(normalizedPath)
  ) {
    normalizedPath = normalizedPath.slice(4) || "/";
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
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
    window.open(
      resolveVerificationDocumentUrl(path),
      "_blank",
      "noopener,noreferrer",
    );
  },
};
