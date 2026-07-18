import { store } from "@/data/store";
import { http } from "@/services/http";
import type {
  AssignCourierPayload,
  CreateDeliveryPayload,
  DeliveryListParams,
  DeliveryRecord,
  PaginatedDeliveries,
  UpdateDeliveryStatusPayload,
} from "@/types/delivery";

const requireToken = () => {
  const token = store.getAuthToken();
  if (!token) throw new Error("Please log in again to continue.");
  return token;
};

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
    http<PaginatedDeliveries>(`/deliveries${buildQueryString(params)}`, {
      token: requireToken(),
    }),

  get: (id: string) =>
    http<DeliveryRecord>(`/deliveries/${id}`, {
      token: requireToken(),
    }),

  create: (input: CreateDeliveryPayload) =>
    http<DeliveryRecord>("/deliveries", {
      method: "POST",
      token: requireToken(),
      body: JSON.stringify(input),
    }),

  assignCourier: (id: string, input: AssignCourierPayload) =>
    http<DeliveryRecord>(`/deliveries/${id}/assign`, {
      method: "PATCH",
      token: requireToken(),
      body: JSON.stringify(input),
    }),

  updateStatus: (id: string, input: UpdateDeliveryStatusPayload) =>
    http<DeliveryRecord>(`/deliveries/${id}/status`, {
      method: "PATCH",
      token: requireToken(),
      body: JSON.stringify(input),
    }),

  cancel: (id: string) =>
    http<DeliveryRecord>(`/deliveries/${id}/cancel`, {
      method: "PATCH",
      token: requireToken(),
    }),
};
