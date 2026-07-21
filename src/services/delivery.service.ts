import { http } from "@/services/http";
import type {
  AssignCourierPayload,
  CreateDeliveryPayload,
  DeliveryListParams,
  DeliveryRecord,
  PaginatedDeliveries,
  UpdateDeliveryStatusPayload,
} from "@/types/delivery";

const buildQueryString = (params: DeliveryListParams = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const deliveryService = {
  list: (params?: DeliveryListParams) =>
    http<PaginatedDeliveries>(`/deliveries${buildQueryString(params)}`, {}),

  get: (id: string) => http<DeliveryRecord>(`/deliveries/${id}`, {}),

  create: (input: CreateDeliveryPayload) =>
    http<DeliveryRecord>("/deliveries", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  assignCourier: (id: string, input: AssignCourierPayload) =>
    http<DeliveryRecord>(`/deliveries/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  updateStatus: (id: string, input: UpdateDeliveryStatusPayload) =>
    http<DeliveryRecord>(`/deliveries/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  cancel: (id: string) =>
    http<DeliveryRecord>(`/deliveries/${id}/cancel`, {
      method: "PATCH",
    }),
};
