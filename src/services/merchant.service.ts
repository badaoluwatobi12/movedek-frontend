import { store } from "@/data/store";
export const merchantService = { orders: () => store.getState().deliveries };
