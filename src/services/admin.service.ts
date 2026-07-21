import type { Courier } from "@/lib/types";
import { http } from "./http";

export type EmailDeliveryStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "delivery_delayed"
  | "bounced"
  | "complained"
  | "suppressed"
  | "failed";

export interface EmailDeliveryRecord {
  id: string;
  userId: string | null;
  recipient: string;
  template: string;
  subject: string;
  provider: string;
  providerMessageId: string | null;
  status: EmailDeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDeliveryPage {
  items: EmailDeliveryRecord[];
  page: number;
  limit: number;
  total: number;
}

export const adminService = {
  reviewCourier: (
    courierId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) =>
    http<Courier>(`/admin/couriers/${encodeURIComponent(courierId)}/review`, {
      method: "POST",
      body: JSON.stringify({ decision, reason }),
    }),

  listEmailDeliveries: (page = 1, limit = 50) =>
    http<EmailDeliveryPage>(
      `/admin/email-deliveries?page=${page}&limit=${limit}`,
    ),

  sendTestEmail: (recipient: string) =>
    http("/admin/email/test", {
      method: "POST",
      body: JSON.stringify({ recipient }),
    }),
};
