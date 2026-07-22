import { store } from "@/data/store";
import { http } from "@/services/http";

export const supportService = {
  create: (
    userId: string,
    subject: string,
    message: string,
    metadata?: { category?: string; priority?: string; requester_role?: string },
  ) => store.addTicket(userId, subject, message, metadata),

  reportFraud: (input: {
    report_type: string;
    reference?: string;
    details: string;
    urgent?: boolean;
    reporter_role: string;
  }) =>
    http<{ id: string; status: string }>("/support/fraud-alerts", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
