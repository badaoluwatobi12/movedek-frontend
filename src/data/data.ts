import type {
  User,
  Courier,
  Merchant,
  Delivery,
  Payment,
  Wallet,
  WalletTx,
  Withdrawal,
  Rating,
  Dispute,
  Ticket,
  Notification,
  Role,
} from "@/lib/types";

// No demo/fake records. Real data is loaded from PostgreSQL through src/data/store.ts.
export const users: User[] = [];
export const couriers: Courier[] = [];
export const merchants: Merchant[] = [];
export const deliveries: Delivery[] = [];
export const payments: Payment[] = [];
export const wallets: Wallet[] = [];
export const walletTx: WalletTx[] = [];
export const withdrawals: Withdrawal[] = [];
export const ratings: Rating[] = [];
export const disputes: Dispute[] = [];
export const tickets: Ticket[] = [];
export const notifications: Notification[] = [];

export const findUser = (id: string) => users.find((u) => u.id === id);
export const findCourier = (id?: string) => couriers.find((c) => c.id === id);
export const findMerchant = (id?: string) => merchants.find((m) => m.id === id);
export const usersByRole = (r: Role) => users.filter((u) => u.role === r);
