import { useSession } from "@/data/store";
export function useRole() {
  return useSession()?.role ?? null;
}
