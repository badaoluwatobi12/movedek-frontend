import type { Payment } from "@/lib/types";

export type PaymentProvider = "wallet" | "paystack";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type EscrowStatus = "not_started" | "held" | "released" | "refunded";
export type RefundStatus = "pending" | "pending_gateway" | "processed" | "rejected" | "failed";

export interface PaymentRecord extends Omit<Payment, "provider" | "status" | "escrow_status"> {
  provider: PaymentProvider;
  status: PaymentStatus;
  escrow_status: EscrowStatus;
  currency?: "NGN";
  refunded_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RefundRecord {
  id: string;
  payment_id: string;
  delivery_id: string;
  customer_id: string;
  dispute_id: string | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  provider: PaymentProvider;
  processed_by: string | null;
  gateway_reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  processed_at: string | null;
}

export interface RefundPaymentPayload {
  amount?: number;
  reason: string;
  dispute_id?: string;
}

export interface RefundPaymentResult {
  payment: PaymentRecord;
  refund: RefundRecord;
  gateway_action_required: boolean;
}

export interface InitializePaymentPayload {
  delivery_id: string;
  provider: PaymentProvider;
  email?: string;
}

export interface InitializePaymentResult {
  payment: PaymentRecord;
  authorization_url: string | null;
  access_code: string | null;
}

export type { PaymentRecord as Payment };
