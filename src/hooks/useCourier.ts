import { useStore } from "@/data/store";
export function useCourier(id?: string) {
  return useStore((s) =>
    id ? s.couriers.find((c) => c.id === id) : s.couriers[0],
  );
}
