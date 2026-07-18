import { store } from "@/data/store";
import { http } from "@/services/http";
import type {
  InitializePaymentPayload,
  InitializePaymentResult,
  PaymentRecord,
  RefundPaymentPayload,
  RefundPaymentResult,
} from "@/types/payment";

const requireToken = () => {
  const token = store.getAuthToken();
  if (!token) throw new Error("Please log in again to continue.");
  return token;
};

export const paymentService = {
  list: () =>
    http<PaymentRecord[]>("/payments", {
      token: requireToken(),
    }),

  initialize: (input: InitializePaymentPayload) =>
    http<InitializePaymentResult>("/payments/initialize", {
      method: "POST",
      token: requireToken(),
      body: JSON.stringify(input),
    }),

  verify: (reference: string) =>
    http<PaymentRecord>(`/payments/verify/${encodeURIComponent(reference)}`, {
      token: requireToken(),
    }),

  refund: (id: string, input: RefundPaymentPayload) =>
    http<RefundPaymentResult>(`/payments/${id}/refund`, {
      method: "PATCH",
      token: requireToken(),
      body: JSON.stringify(input),
    }),
};
