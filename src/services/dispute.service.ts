import { http } from "@/services/http";
import type {
  CreateDisputePayload,
  DisputeListParams,
  DisputeRecord,
  PaginatedDisputes,
  UpdateDisputePayload,
} from "@/types/dispute";

const buildQueryString = (params: DisputeListParams = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const disputeService = {
  list: (params?: DisputeListParams) =>
    http<PaginatedDisputes>(`/disputes${buildQueryString(params)}`, {}),

  get: (id: string) => http<DisputeRecord>(`/disputes/${id}`, {}),

  create: (input: CreateDisputePayload) =>
    http<DisputeRecord>("/disputes", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdateDisputePayload) =>
    http<DisputeRecord>(`/disputes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
