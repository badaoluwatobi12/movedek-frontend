import type { Wallet, WalletTx, Withdrawal } from "@/lib/types";

export interface WalletWithTransactions {
  wallet: Wallet;
  transactions: WalletTx[];
}

export interface TopUpWalletPayload {
  amount: number;
  user_id?: string;
}

export interface TopUpWalletResult {
  wallet: Wallet;
  transaction: WalletTx;
}

export type WalletTopupStatus = "pending" | "paid" | "failed";

export interface WalletTopup {
  id: string;
  user_id: string;
  amount: number;
  currency: "NGN";
  status: WalletTopupStatus;
  reference: string;
  authorization_url: string | null;
  access_code: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InitializeWalletTopUpPayload {
  amount: number;
}

export interface InitializeWalletTopUpResult {
  topup: WalletTopup;
  authorization_url: string | null;
  access_code: string | null;
}

export type { Wallet, WalletTx, Withdrawal };
