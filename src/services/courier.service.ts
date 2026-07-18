import { store } from "@/data/store";
export const courierService = {
  list: () => store.getState().couriers,
  get: (id: string) => store.getState().couriers.find((c) => c.id === id),
};
