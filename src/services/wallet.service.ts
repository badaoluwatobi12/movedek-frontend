import { store } from "@/data/store";
import { http } from "@/services/http";
import type {
  InitializeWalletTopUpPayload,
  InitializeWalletTopUpResult,
  TopUpWalletPayload,
  TopUpWalletResult,
  WalletTopup,
  WalletWithTransactions,
} from "@/types/wallet";

const requireToken = () => {
  const token = store.getAuthToken();
  if (!token) throw new Error("Please log in again to continue.");
  return token;
};

export const walletService = {
  getMine: () =>
    http<WalletWithTransactions>("/wallets/me", {
      token: requireToken(),
    }),

  topUp: (input: TopUpWalletPayload) =>
    http<TopUpWalletResult>("/wallets/top-up", {
      method: "POST",
      token: requireToken(),
      body: JSON.stringify(input),
    }),

  initializeTopUp: (input: InitializeWalletTopUpPayload) =>
    http<InitializeWalletTopUpResult>("/wallets/topup/initialize", {
      method: "POST",
      token: requireToken(),
      body: JSON.stringify(input),
    }),

  verifyTopUp: (reference: string) =>
    http<WalletTopup>(`/wallets/topup/verify/${encodeURIComponent(reference)}`, {
      token: requireToken(),
    }),
};
