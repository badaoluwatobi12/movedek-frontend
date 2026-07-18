import { store } from "@/data/store";
import type { Role } from "@/lib/types";

export const authService = {
  login: (email: string, password: string) => store.loginWithCredentials(email, password),
  logout: () => store.logout(),
  register: (input: { full_name: string; email: string; phone: string; password?: string; role: Role }) =>
    store.registerAccount(input),
};
