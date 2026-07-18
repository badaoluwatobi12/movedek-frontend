import { store } from "@/data/store";

export const supportService = {
  create: (userId: string, subject: string, message: string) => store.addTicket(userId, subject, message),
};
