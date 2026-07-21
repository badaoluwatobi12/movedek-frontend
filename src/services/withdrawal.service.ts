import { store } from "@/data/store";
export const withdrawalService = {
  request: (courierId: string, amount: number) =>
    store.requestWithdrawal(courierId, amount),
};
