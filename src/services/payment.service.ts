import { http } from "@/services/http";
import type {
  InitializePaymentPayload,
  InitializePaymentResult,
  PaymentRecord,
  RefundPaymentPayload,
  RefundPaymentResult,
} from "@/types/payment";

export const paymentService = {
  list: () => http<PaymentRecord[]>("/payments", {}),

  initialize: (input: InitializePaymentPayload) =>
    http<InitializePaymentResult>("/payments/initialize", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  verify: (reference: string) =>
    http<PaymentRecord>(
      `/payments/verify/${encodeURIComponent(reference)}`,
      {},
    ),

  refund: (id: string, input: RefundPaymentPayload) =>
    http<RefundPaymentResult>(`/payments/${id}/refund`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
