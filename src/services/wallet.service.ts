import { http } from "@/services/http";
import type {
  InitializeWalletTopUpPayload,
  InitializeWalletTopUpResult,
  TopUpWalletPayload,
  TopUpWalletResult,
  WalletTopup,
  WalletWithTransactions,
} from "@/types/wallet";

export const walletService = {
  getMine: () => http<WalletWithTransactions>("/wallets/me", {}),

  topUp: (input: TopUpWalletPayload) =>
    http<TopUpWalletResult>("/wallets/top-up", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  initializeTopUp: (input: InitializeWalletTopUpPayload) =>
    http<InitializeWalletTopUpResult>("/wallets/topup/initialize", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  verifyTopUp: (reference: string) =>
    http<WalletTopup>(
      `/wallets/topup/verify/${encodeURIComponent(reference)}`,
      {},
    ),
};
