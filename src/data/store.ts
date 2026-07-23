import { useCallback, useRef, useSyncExternalStore } from "react";
import type {
  Courier,
  Delivery,
  DeliveryStatus,
  Dispute,
  Merchant,
  Notification,
  Payment,
  Rating,
  Role,
  Ticket,
  User,
  Wallet,
  WalletTx,
  Withdrawal,
} from "@/lib/types";
import { genId, genPin, riskFor } from "@/lib/format";
import { API_BASE_URL } from "@/services/apiBase";
import {
  clearStoredAuth,
  getStoredAuthUser as getAuthStorageUser,
  getStoredSession as getAuthStorageSession,
  normalizeRole as normalizeStoredRole,
  saveStoredAuth,
} from "@/lib/authStorage";

type Session = { userId: string; role: Role } | null;
type RegistrationDraft = Pick<
  User,
  "full_name" | "email" | "phone" | "role"
> & { password?: string };

export type SavedAddress = {
  id: string;
  user_id: string;
  label: string;
  address: string;
};

type State = {
  session: Session;
  users: User[];
  deliveries: Delivery[];
  couriers: Courier[];
  merchants: Merchant[];
  wallets: Wallet[];
  walletTx: WalletTx[];
  payments: Payment[];
  withdrawals: Withdrawal[];
  tickets: Ticket[];
  savedAddresses: SavedAddress[];
  notifications: Notification[];
  disputes: Dispute[];
  ratings: Rating[];
  auditLogs: {
    id: string;
    action: string;
    details?: unknown;
    created_at: string;
  }[];
  settings: AdminSettings;
  pendingRegistration: RegistrationDraft | null;
  loading: boolean;
  apiError: string | null;
};

export type AdminSettings = {
  pricing: {
    base_fare: number;
    per_km: number;
    service_fee_percent: number;
    protection_fee: number;
  };
  trust_caps: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  categories: Record<string, boolean>;
};

type RemoteSnapshot = Partial<
  Omit<State, "session" | "pendingRegistration" | "loading" | "apiError">
>;

let remoteSaveTimer: ReturnType<typeof setTimeout> | null = null;
let storeVersion = 0;
let hydrationPromise: Promise<void> | null = null;

// Session/token persistence lives in one place: @/lib/authStorage. Everything
// below is a thin wrapper so the rest of this file (and its public API) can
// keep calling the same names it always has.
const normalizeRole = (role: unknown): Role =>
  normalizeStoredRole(role) ?? "customer";

const readStoredUser = (): Partial<User> | null => getAuthStorageUser();

const readStoredSession = (): Session => getAuthStorageSession();

const saveStoredSession = (user: User) => {
  saveStoredAuth(user);
};

const clearStoredSession = () => {
  clearStoredAuth();
};

export const getStoredAuthSession = () => readStoredSession();
export const getStoredAuthUser = () => readStoredUser();
const defaultSettings = (): AdminSettings => ({
  pricing: {
    base_fare: 900,
    per_km: 150,
    service_fee_percent: 8,
    protection_fee: 300,
  },
  trust_caps: { bronze: 15000, silver: 75000, gold: 250000, platinum: 5000000 },
  categories: { general: true },
});

const emptyState = (): State => ({
  session: null,
  users: [],
  deliveries: [],
  couriers: [],
  merchants: [],
  wallets: [],
  walletTx: [],
  payments: [],
  withdrawals: [],
  tickets: [],
  savedAddresses: [],
  notifications: [],
  disputes: [],
  ratings: [],
  auditLogs: [],
  settings: defaultSettings(),
  pendingRegistration: null,
  loading: true,
  apiError: null,
});

const state: State = { ...emptyState(), session: readStoredSession() };

const createId = (prefix = "id") => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return genId(prefix);
};

const levelCap = (level: Courier["trust_level"]) =>
  state.settings.trust_caps[level] ?? 0;

const activeDeliveryStatuses: DeliveryStatus[] = [
  "assigned",
  "picked_up",
  "in_transit",
];

const courierCanTakeDelivery = (courier: Courier, delivery: Delivery) => {
  if (courier.verification_status !== "approved")
    return {
      ok: false,
      message: "Your courier verification is not approved yet.",
    };
  if (!courier.is_online)
    return { ok: false, message: "Go online before accepting jobs." };
  if (delivery.status !== "searching")
    return { ok: false, message: "This job is no longer available." };
  if (delivery.courier_id)
    return { ok: false, message: "This job already has a courier." };
  if (delivery.item_value > levelCap(courier.trust_level))
    return {
      ok: false,
      message: `Your ${courier.trust_level} level can only accept jobs up to ${levelCap(courier.trust_level)}.`,
    };
  const active = state.deliveries.some(
    (d) =>
      d.courier_id === courier.id && activeDeliveryStatuses.includes(d.status),
  );
  if (active)
    return {
      ok: false,
      message: "Complete your active job before accepting another one.",
    };
  return { ok: true, message: "OK" };
};

const courierWallet = (courier: Courier) =>
  state.wallets.find((w) => w.user_id === courier.user_id);

const ensureCourierWallet = (courier: Courier) => {
  let wallet = courierWallet(courier);
  if (!wallet) {
    wallet = {
      id: createId("wallet"),
      user_id: courier.user_id,
      balance: 0,
      created_at: new Date().toISOString(),
    };
    replaceArray(state.wallets, [wallet, ...state.wallets]);
  }
  return wallet;
};

const listeners = new Set<() => void>();
const emit = () => {
  storeVersion += 1;
  listeners.forEach((l) => l());
};

const replaceArray = <T>(target: T[], value: T[]) => {
  const key = Object.keys(state).find(
    (stateKey) =>
      (state as unknown as Record<string, unknown>)[stateKey] === target,
  );
  if (key) {
    (state as unknown as Record<string, unknown>)[key] = value;
    return;
  }

  target.splice(0, target.length, ...value);
};

const applySnapshot = (snapshot: RemoteSnapshot) => {
  if (Array.isArray(snapshot.users)) replaceArray(state.users, snapshot.users);
  if (Array.isArray(snapshot.deliveries))
    replaceArray(state.deliveries, snapshot.deliveries);
  if (Array.isArray(snapshot.couriers))
    replaceArray(state.couriers, snapshot.couriers);
  if (Array.isArray(snapshot.merchants))
    replaceArray(state.merchants, snapshot.merchants);
  if (Array.isArray(snapshot.wallets))
    replaceArray(state.wallets, snapshot.wallets);
  if (Array.isArray(snapshot.walletTx))
    replaceArray(state.walletTx, snapshot.walletTx);
  if (Array.isArray(snapshot.payments))
    replaceArray(state.payments, snapshot.payments);
  if (Array.isArray(snapshot.withdrawals))
    replaceArray(state.withdrawals, snapshot.withdrawals);
  if (Array.isArray(snapshot.tickets))
    replaceArray(state.tickets, snapshot.tickets);
  if (Array.isArray(snapshot.savedAddresses))
    replaceArray(state.savedAddresses, snapshot.savedAddresses);
  if (Array.isArray(snapshot.notifications))
    replaceArray(state.notifications, snapshot.notifications);
  if (Array.isArray(snapshot.disputes))
    replaceArray(state.disputes, snapshot.disputes);
  if (Array.isArray(snapshot.ratings))
    replaceArray(state.ratings, snapshot.ratings);
  if (Array.isArray(snapshot.auditLogs))
    replaceArray(state.auditLogs, snapshot.auditLogs);
  if (snapshot.settings && typeof snapshot.settings === "object") {
    state.settings = {
      ...defaultSettings(),
      ...snapshot.settings,
      pricing: {
        ...defaultSettings().pricing,
        ...(snapshot.settings as AdminSettings).pricing,
      },
      trust_caps: {
        ...defaultSettings().trust_caps,
        ...(snapshot.settings as AdminSettings).trust_caps,
      },
      categories: {
        ...defaultSettings().categories,
        ...(snapshot.settings as AdminSettings).categories,
      },
    };
  }
};

const remoteSnapshot = (): RemoteSnapshot => ({
  users: state.users,
  deliveries: state.deliveries,
  couriers: state.couriers,
  merchants: state.merchants,
  wallets: state.wallets,
  walletTx: state.walletTx,
  payments: state.payments,
  withdrawals: state.withdrawals,
  tickets: state.tickets,
  savedAddresses: state.savedAddresses,
  notifications: state.notifications,
  disputes: state.disputes,
  ratings: state.ratings,
  auditLogs: state.auditLogs,
  settings: state.settings,
});

const hasStringMessage = (value: unknown): value is { message: string } =>
  typeof value === "object" &&
  value !== null &&
  "message" in value &&
  typeof value.message === "string";

const hasData = (value: unknown): value is { data: unknown } =>
  typeof value === "object" && value !== null && "data" in value;

const unwrapApiData = async (response: Response) => {
  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const error = new Error(
      hasStringMessage(json)
        ? json.message
        : `API request failed with status ${response.status}`,
    ) as Error & {
      status?: number;
      code?: string;
      details?: unknown;
    };
    error.status = response.status;
    if (typeof json === "object" && json !== null) {
      const record = json as { code?: unknown; details?: unknown };
      if (typeof record.code === "string") error.code = record.code;
      error.details = record.details;
    }
    throw error;
  }

  return hasData(json) ? json.data : json;
};

const getErrorStatus = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  typeof (error as { status?: unknown }).status === "number"
    ? (error as { status: number }).status
    : null;

const getErrorCode = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : null;

const API_TIMEOUT_MS = 15_000;

const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const upstreamSignal = options.signal;
  const abortFromUpstream = () => controller.abort();
  upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      credentials: "include",
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...(options.headers ?? {}),
      },
    });
    return unwrapApiData(response) as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "The MoveDek server took too long to respond. Please retry.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", abortFromUpstream);
  }
};

const performRemoteStateLoad = async () => {
  state.loading = true;
  state.apiError = null;
  emit();

  try {
    // The HttpOnly cookie is the web source of authentication truth. The
    // browser-stored session is only a UI cache and is rebuilt from /auth/me.
    const user = await apiFetch<User>("/auth/me");
    setSessionFromUser(user);

    const snapshot = await apiFetch<RemoteSnapshot>("/app-state");
    applySnapshot(snapshot);
    state.apiError = null;
  } catch (error) {
    if (
      getErrorStatus(error) === 401 ||
      getErrorCode(error) === "EMAIL_NOT_VERIFIED"
    ) {
      state.session = null;
      clearStoredSession();
      state.apiError = null;
    } else {
      state.apiError =
        error instanceof Error
          ? error.message
          : "Could not connect to the MoveDek backend.";
    }
  } finally {
    state.loading = false;
    emit();
  }
};

const loadRemoteState = () => {
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = performRemoteStateLoad().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
};

/**
 * Writes no longer go through PUT /api/app-state.
 *
 * That endpoint accepted the browser's entire local state object and replaced
 * the server's copy with it: no validation, no transaction, last-write-wins
 * between concurrent admins, and money fields authored by the client. It now
 * returns 410.
 *
 * Mutations belong to the domain endpoints, reached through services/*.ts and
 * the React Query hooks. This store is a read cache: after a mutation lands, we
 * re-read our authorization-scoped slice of server state.
 */
const scheduleRefresh = () => {
  if (remoteSaveTimer) clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(() => {
    void loadRemoteState();
  }, 250);
};

const persist = () => {
  scheduleRefresh();
};

const refreshAfterMutation = async () => {
  try {
    await loadRemoteState();
  } catch {
    state.apiError = "Change saved, but the latest data could not be refreshed.";
    emit();
  }
};

const commitRemote = async <T = unknown>(
  path: string,
  options: RequestInit,
  behavior: { throwOnError?: boolean } = {},
): Promise<T | null> => {
  let result: T;
  try {
    result = await apiFetch<T>(path, options);
  } catch (error) {
    state.apiError =
      error instanceof Error ? error.message : "Could not save this change.";
    emit();
    await loadRemoteState().catch(() => undefined);
    if (behavior.throwOnError) throw error;
    return null;
  }

  await refreshAfterMutation();
  return result;
};

const setSessionFromUser = (user: User) => {
  state.session = { userId: user.id, role: user.role };
  saveStoredSession(user);
};

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  getState() {
    return state;
  },

  getStoredSession() {
    return readStoredSession();
  },

  getStoredUser() {
    return readStoredUser();
  },

  hydrate() {
    state.session = readStoredSession();
    emit();
    return loadRemoteState();
  },

  refresh() {
    return loadRemoteState();
  },

  resetLocalData() {
    state.session = null;
    state.pendingRegistration = null;
    applySnapshot({
      users: [],
      deliveries: [],
      couriers: [],
      merchants: [],
      wallets: [],
      walletTx: [],
      payments: [],
      withdrawals: [],
      tickets: [],
      savedAddresses: [],
      notifications: [],
      disputes: [],
      ratings: [],
      auditLogs: [],
      settings: defaultSettings(),
    });
    emit();
    return this.refresh();
  },

  login(userId: string, role: Role) {
    // Session only. App data still comes from PostgreSQL through /api/app-state.
    state.session = { userId, role };
    emit();
  },

  async loginWithCredentials(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await apiFetch<{
      user: User;
      snapshot?: RemoteSnapshot;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    if (result.snapshot) applySnapshot(result.snapshot);
    setSessionFromUser(result.user);
    state.apiError = null;
    emit();

    // Do not resolve login until the authorization-scoped PostgreSQL snapshot is ready.
    // This prevents role dashboards from mounting against an empty cache on first navigation.
    await loadRemoteState();
    return result.user;
  },

  async loginWithEmail(email: string, password = "") {
    return this.loginWithCredentials(email, password);
  },

  async logout(options: { skipRemote?: boolean } = {}) {
    if (!options.skipRemote) {
      await apiFetch("/auth/logout", { method: "POST" });
    }
    state.session = null;
    state.pendingRegistration = null;
    clearStoredSession();
    emit();
  },

  startRegistration(input: RegistrationDraft) {
    state.pendingRegistration = {
      ...input,
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      full_name: input.full_name.trim(),
    };
    emit();
  },

  async registerAccount(input: RegistrationDraft) {
    const result = await apiFetch<{
      user: User;
      email: string;
      verificationRequired: true;
      emailSent: boolean;
      expiresAt: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        password: input.password,
        role: input.role,
      }),
    });
    state.pendingRegistration = null;
    state.session = null;
    clearStoredSession();
    state.apiError = null;
    emit();
    return result;
  },

  verifyEmail(token: string) {
    return apiFetch<{ verified: true; email: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  resendEmailVerification(email: string) {
    return apiFetch<{ requested: true; emailSent?: boolean }>(
      "/auth/resend-verification",
      {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      },
    );
  },

  completeRegistration() {
    // OTP is temporarily client-only. Use registerAccount from the register screen for real database creation.
    return null;
  },

  updateUser(
    userId: string,
    patch: Partial<Pick<User, "full_name" | "email" | "phone">>,
  ) {
    replaceArray(
      state.users,
      state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    );
    commitRemote("/users/me", { method: "PATCH", body: JSON.stringify(patch) });
    emit();
  },

  createDelivery(
    input: Omit<
      Delivery,
      | "id"
      | "pickup_pin"
      | "dropoff_pin"
      | "created_at"
      | "status"
      | "risk_level"
    > & {
      status?: DeliveryStatus;
    },
  ) {
    const now = new Date().toISOString();
    let wallet = state.wallets.find((w) => w.user_id === input.customer_id);
    if (!wallet) {
      wallet = {
        id: createId("wallet"),
        user_id: input.customer_id,
        balance: 0,
        created_at: now,
      };
      replaceArray(state.wallets, [wallet, ...state.wallets]);
    }

    if (wallet.balance < input.price) {
      throw new Error(
        "Insufficient wallet balance. Top up your wallet before creating this delivery.",
      );
    }

    const d: Delivery = {
      ...input,
      id: createId("delivery"),
      status: input.status ?? "searching",
      risk_level: riskFor(input.item_value),
      pickup_pin: genPin(),
      dropoff_pin: genPin(),
      created_at: now,
    };
    const payment: Payment = {
      id: createId("payment"),
      delivery_id: d.id,
      customer_id: d.customer_id,
      amount: d.price,
      status: "paid",
      provider: "Wallet escrow",
      reference: `WLT-${Math.floor(10000000 + Math.random() * 89999999)}`,
      created_at: d.created_at,
    };

    wallet.balance -= d.price;
    replaceArray(state.deliveries, [d, ...state.deliveries]);
    replaceArray(state.payments, [payment, ...state.payments]);
    replaceArray(state.walletTx, [
      {
        id: createId("tx"),
        wallet_id: wallet.id,
        type: "debit",
        amount: d.price,
        description: `Escrow payment for ${d.item_name}`,
        status: "success",
        created_at: d.created_at,
      },
      ...state.walletTx,
    ]);
    replaceArray(state.notifications, [
      {
        id: createId("notification"),
        user_id: d.customer_id,
        title: "Delivery request created",
        message: `${d.item_name} is now waiting for a verified courier.`,
        read: false,
        created_at: now,
      },
      ...state.notifications,
    ]);

    this.addAudit("Customer created delivery", {
      deliveryId: d.id,
      customerId: d.customer_id,
      amount: d.price,
    });
    persist();
    emit();
    return d;
  },

  updateDelivery(id: string, patch: Partial<Delivery>) {
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
    if (patch.status === "delivered") {
      replaceArray(
        state.payments,
        state.payments.map((p) =>
          p.delivery_id === id ? { ...p, status: "paid" } : p,
        ),
      );
    }
    persist();
    emit();
  },

  cancelCustomerDelivery(deliveryId: string, customerId: string) {
    const delivery = state.deliveries.find((d) => d.id === deliveryId);
    if (!delivery || delivery.customer_id !== customerId)
      return { ok: false, message: "Delivery not found." };
    if (!["searching", "assigned"].includes(delivery.status)) {
      return {
        ok: false,
        message: "This delivery can only be cancelled before pickup.",
      };
    }

    const cancelledAt = new Date().toISOString();
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) =>
        d.id === deliveryId ? { ...d, status: "cancelled" } : d,
      ),
    );

    const payment = state.payments.find((p) => p.delivery_id === deliveryId);
    let wallet = state.wallets.find((w) => w.user_id === customerId);
    if (payment && payment.status !== "refunded") {
      if (!wallet) {
        wallet = {
          id: createId("wallet"),
          user_id: customerId,
          balance: 0,
          created_at: cancelledAt,
        };
        replaceArray(state.wallets, [wallet, ...state.wallets]);
      }
      wallet.balance += payment.amount;
      replaceArray(
        state.payments,
        state.payments.map((p) =>
          p.id === payment.id ? { ...p, status: "refunded" } : p,
        ),
      );
      replaceArray(state.walletTx, [
        {
          id: createId("tx"),
          wallet_id: wallet.id,
          type: "credit",
          amount: payment.amount,
          description: `Refund for cancelled delivery ${delivery.item_name}`,
          status: "success",
          created_at: cancelledAt,
        },
        ...state.walletTx,
      ]);
    }

    replaceArray(state.notifications, [
      {
        id: createId("notification"),
        user_id: customerId,
        title: "Delivery cancelled",
        message: `${delivery.item_name} was cancelled and eligible funds were returned to your wallet.`,
        read: false,
        created_at: cancelledAt,
      },
      ...state.notifications,
    ]);
    this.addAudit("Customer cancelled delivery", { deliveryId, customerId });
    persist();
    emit();
    return { ok: true, message: "Delivery cancelled and wallet updated." };
  },

  createCustomerDispute(
    deliveryId: string,
    customerId: string,
    reason: string,
  ) {
    const delivery = state.deliveries.find((d) => d.id === deliveryId);
    if (!delivery || delivery.customer_id !== customerId)
      return { ok: false, message: "Delivery not found." };
    const cleanReason = reason.trim();
    if (cleanReason.length < 5)
      return { ok: false, message: "Add a clear dispute reason." };
    const existing = state.disputes.find(
      (d) =>
        d.delivery_id === deliveryId &&
        d.user_id === customerId &&
        ["open", "reviewing"].includes(d.status),
    );
    if (existing)
      return {
        ok: false,
        message: "You already have an open dispute for this delivery.",
      };

    const createdAt = new Date().toISOString();
    const dispute: Dispute = {
      id: createId("dispute"),
      delivery_id: deliveryId,
      user_id: customerId,
      reason: cleanReason,
      status: "open",
      created_at: createdAt,
    };
    replaceArray(state.disputes, [dispute, ...state.disputes]);
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) =>
        d.id === deliveryId ? { ...d, status: "disputed" } : d,
      ),
    );
    this.addTicket(
      customerId,
      `Dispute for ${delivery.item_name}`,
      cleanReason,
    );
    this.addAudit("Customer opened dispute", {
      deliveryId,
      customerId,
      disputeId: dispute.id,
    });
    persist();
    emit();
    return {
      ok: true,
      message: "Dispute opened. Support can now review it.",
      dispute,
    };
  },

  rateCourierDelivery(
    deliveryId: string,
    fromUserId: string,
    ratingValue: number,
    comment?: string,
  ) {
    const delivery = state.deliveries.find((d) => d.id === deliveryId);
    if (!delivery || delivery.customer_id !== fromUserId)
      return { ok: false, message: "Delivery not found." };
    if (delivery.status !== "delivered")
      return {
        ok: false,
        message: "You can rate only after delivery is completed.",
      };
    const courier = state.couriers.find((c) => c.id === delivery.courier_id);
    if (!courier)
      return { ok: false, message: "Courier not found for this delivery." };
    const value = Math.max(1, Math.min(5, Math.round(ratingValue)));
    const createdAt = new Date().toISOString();
    const existing = state.ratings.find(
      (r) => r.delivery_id === deliveryId && r.from_user_id === fromUserId,
    );
    const rating: Rating = {
      id: existing?.id ?? createId("rating"),
      delivery_id: deliveryId,
      from_user_id: fromUserId,
      to_user_id: courier.user_id,
      rating: value,
      comment: comment?.trim() || undefined,
      created_at: existing?.created_at ?? createdAt,
    };
    replaceArray(
      state.ratings,
      existing
        ? state.ratings.map((r) => (r.id === existing.id ? rating : r))
        : [rating, ...state.ratings],
    );

    const courierRatings = state.ratings.filter(
      (r) => r.to_user_id === courier.user_id,
    );
    const average = courierRatings.length
      ? courierRatings.reduce((sum, r) => sum + r.rating, 0) /
        courierRatings.length
      : value;
    replaceArray(
      state.couriers,
      state.couriers.map((c) =>
        c.id === courier.id ? { ...c, rating: Number(average.toFixed(1)) } : c,
      ),
    );
    this.addAudit("Customer rated courier", {
      deliveryId,
      courierId: courier.id,
      rating: value,
    });
    commitRemote("/ratings", {
      method: "POST",
      body: JSON.stringify({
        delivery_id: deliveryId,
        rating: value,
        comment: comment?.trim() || undefined,
      }),
    });
    emit();
    return { ok: true, message: "Rating saved." };
  },

  acceptCourierJob(deliveryId: string, courierId: string) {
    const courier = state.couriers.find((c) => c.id === courierId);
    const delivery = state.deliveries.find((d) => d.id === deliveryId);
    if (!courier || !delivery)
      return { ok: false, message: "Courier or delivery not found." };
    const check = courierCanTakeDelivery(courier, delivery);
    if (!check.ok) return check;
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) =>
        d.id === deliveryId
          ? { ...d, courier_id: courierId, status: "assigned" }
          : d,
      ),
    );
    this.addAudit("Courier accepted job", { deliveryId, courierId });
    persist();
    emit();
    return { ok: true, message: "Job accepted." };
  },

  confirmCourierPickup(deliveryId: string) {
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: "picked_up",
              pickup_confirmed_at: new Date().toISOString(),
              pickup_proof_uploaded: true,
            }
          : d,
      ),
    );
    this.addAudit("Courier confirmed pickup", { deliveryId });
    persist();
    emit();
  },

  startCourierTransit(deliveryId: string) {
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: "in_transit",
              transit_started_at: new Date().toISOString(),
            }
          : d,
      ),
    );
    this.addAudit("Courier started transit", { deliveryId });
    persist();
    emit();
  },

  completeCourierDelivery(deliveryId: string, courierId: string) {
    const delivery = state.deliveries.find((d) => d.id === deliveryId);
    const courier = state.couriers.find((c) => c.id === courierId);
    if (!delivery || !courier)
      return { ok: false, message: "Delivery or courier not found." };
    if (delivery.courier_id !== courier.id)
      return {
        ok: false,
        message: "This delivery is not assigned to this courier.",
      };
    if (delivery.status === "delivered")
      return { ok: true, message: "Delivery already completed." };

    const completedAt = new Date().toISOString();
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: "delivered",
              delivery_confirmed_at: completedAt,
              delivery_proof_uploaded: true,
              completed_at: completedAt,
            }
          : d,
      ),
    );

    replaceArray(
      state.payments,
      state.payments.map((p) =>
        p.delivery_id === deliveryId ? { ...p, status: "paid" } : p,
      ),
    );

    replaceArray(
      state.couriers,
      state.couriers.map((c) =>
        c.id === courierId
          ? {
              ...c,
              completed: c.completed + 1,
              earnings_today: c.earnings_today + delivery.courier_payout,
              trust_score: Math.min(100, c.trust_score + 2),
              rating: c.rating || 0,
            }
          : c,
      ),
    );

    const wallet = ensureCourierWallet(courier);
    wallet.balance += delivery.courier_payout;
    replaceArray(state.walletTx, [
      {
        id: createId("tx"),
        wallet_id: wallet.id,
        type: "credit",
        amount: delivery.courier_payout,
        description: `Courier payout for ${delivery.item_name}`,
        status: "success",
        created_at: completedAt,
      },
      ...state.walletTx,
    ]);

    replaceArray(state.notifications, [
      {
        id: createId("notification"),
        user_id: delivery.customer_id,
        title: "Delivery completed",
        message: `${delivery.item_name} has been delivered successfully.`,
        read: false,
        created_at: completedAt,
      },
      {
        id: createId("notification"),
        user_id: courier.user_id,
        title: "Payout added",
        message: `${delivery.courier_payout} has been added to your courier wallet.`,
        read: false,
        created_at: completedAt,
      },
      ...state.notifications,
    ]);

    this.addAudit("Courier completed delivery", {
      deliveryId,
      courierId,
      payout: delivery.courier_payout,
    });
    persist();
    emit();
    return { ok: true, message: "Delivery completed." };
  },

  topUpWallet(userId: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return null;
    let wallet = state.wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      wallet = {
        id: createId("wallet"),
        user_id: userId,
        balance: 0,
        created_at: new Date().toISOString(),
      };
      replaceArray(state.wallets, [wallet, ...state.wallets]);
    }
    wallet.balance += amount;
    replaceArray(state.walletTx, [
      {
        id: createId("tx"),
        wallet_id: wallet.id,
        type: "credit",
        amount,
        description: "Wallet top up",
        status: "success",
        created_at: new Date().toISOString(),
      },
      ...state.walletTx,
    ]);
    persist();
    emit();
    return wallet;
  },

  async requestWithdrawal(courierId: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const courier = state.couriers.find(
      (candidate) => candidate.id === courierId,
    );
    if (!courier) return null;
    if (
      !courier.bank_name ||
      courier.bank_name === "Not added" ||
      !courier.account_number ||
      courier.account_number === "Not added"
    ) {
      throw new Error(
        "Add your bank details in courier onboarding before requesting withdrawal.",
      );
    }

    const withdrawal = await apiFetch<Withdrawal>("/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
    await refreshAfterMutation();
    return withdrawal;
  },

  addAddress(input: Omit<SavedAddress, "id">) {
    const address: SavedAddress = { id: createId("addr"), ...input };
    replaceArray(state.savedAddresses, [address, ...state.savedAddresses]);
    commitRemote("/addresses", {
      method: "POST",
      body: JSON.stringify({ label: input.label, address: input.address }),
    });
    emit();
    return address;
  },

  updateAddress(
    id: string,
    patch: Partial<Pick<SavedAddress, "label" | "address">>,
  ) {
    replaceArray(
      state.savedAddresses,
      state.savedAddresses.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
    commitRemote(`/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    emit();
  },

  removeAddress(id: string, userId: string) {
    const before = state.savedAddresses.length;
    replaceArray(
      state.savedAddresses,
      state.savedAddresses.filter(
        (a) => !(a.id === id && a.user_id === userId),
      ),
    );
    if (state.savedAddresses.length !== before) {
      commitRemote(`/addresses/${id}`, { method: "DELETE" });
      emit();
      return { ok: true, message: "Address removed." };
    }
    return { ok: false, message: "Address not found." };
  },

  addTicket(userId: string, subject: string, message: string, metadata: { category?: string; priority?: string; requester_role?: string } = {}) {
    const ticket: Ticket = {
      id: createId("ticket"),
      user_id: userId,
      subject,
      message,
      status: "open",
      created_at: new Date().toISOString(),
      ...metadata,
    } as Ticket;
    replaceArray(state.tickets, [ticket, ...state.tickets]);
    commitRemote("/support", {
      method: "POST",
      body: JSON.stringify({ subject, message, ...metadata }),
    });
    emit();
    return ticket;
  },

  toggleOnline(courierId: string) {
    const courier = state.couriers.find((c) => c.id === courierId);
    if (!courier) return;
    if (courier.verification_status !== "approved" && !courier.is_online) {
      throw new Error("Courier must be approved before going online.");
    }
    replaceArray(
      state.couriers,
      state.couriers.map((c) =>
        c.id === courierId ? { ...c, is_online: !c.is_online } : c,
      ),
    );
    this.addAudit(
      courier.is_online ? "Courier went offline" : "Courier went online",
      { courierId },
    );
    commitRemote(`/couriers/${courierId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_online: !courier.is_online }),
    });
    emit();
  },

  updateCourier(courierId: string, patch: Partial<Courier>) {
    replaceArray(
      state.couriers,
      state.couriers.map((c) => (c.id === courierId ? { ...c, ...patch } : c)),
    );
    const {
      verification_status: _ignoredVerificationStatus,
      trust_level: _ignoredTrustLevel,
      trust_score: _ignoredTrustScore,
      ...remotePatch
    } = patch;
    commitRemote(`/couriers/${courierId}`, {
      method: "PATCH",
      body: JSON.stringify(remotePatch),
    });
    emit();
  },

  updateMerchant(merchantId: string, patch: Partial<Merchant>) {
    replaceArray(
      state.merchants,
      state.merchants.map((merchant) =>
        merchant.id === merchantId ? { ...merchant, ...patch } : merchant,
      ),
    );
    const { status: _ignoredStatus, ...remotePatch } = patch;
    commitRemote(`/merchants/${merchantId}`, {
      method: "PATCH",
      body: JSON.stringify(remotePatch),
    });
    emit();
  },

  addAudit(action: string, details?: unknown) {
    replaceArray(state.auditLogs, [
      {
        id: createId("audit"),
        action,
        details,
        created_at: new Date().toISOString(),
      },
      ...state.auditLogs,
    ]);
  },

  setUserStatus(userId: string, status: User["status"]) {
    replaceArray(
      state.users,
      state.users.map((u) => (u.id === userId ? { ...u, status } : u)),
    );
    this.addAudit(`${status === "active" ? "Activated" : "Suspended"} user`, {
      userId,
      status,
    });
    commitRemote(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    emit();
  },

  setMerchantStatus(merchantId: string, status: Merchant["status"]) {
    replaceArray(
      state.merchants,
      state.merchants.map((m) => (m.id === merchantId ? { ...m, status } : m)),
    );
    this.addAudit(
      `${status === "active" ? "Activated" : "Moved merchant to pending"}`,
      {
        merchantId,
        status,
      },
    );
    commitRemote(`/merchants/${merchantId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    emit();
  },

  async setVerification(
    courierId: string,
    status: "approved" | "rejected",
  ) {
    await commitRemote(
      `/admin/couriers/${courierId}/review`,
      {
        method: "POST",
        body: JSON.stringify({
          decision: status,
          reason:
            status === "approved"
              ? "Required profile and verification documents reviewed."
              : "Application requires corrected profile information or documents.",
        }),
      },
      { throwOnError: true },
    );
  },

  setCourierTrust(courierId: string, trust_level: Courier["trust_level"]) {
    const scoreByLevel: Record<Courier["trust_level"], number> = {
      bronze: 25,
      silver: 55,
      gold: 80,
      platinum: 95,
    };
    replaceArray(
      state.couriers,
      state.couriers.map((c) =>
        c.id === courierId
          ? {
              ...c,
              trust_level,
              trust_score: Math.max(c.trust_score, scoreByLevel[trust_level]),
            }
          : c,
      ),
    );
    this.addAudit(`Changed courier trust level`, { courierId, trust_level });
    commitRemote(`/couriers/${courierId}`, {
      method: "PATCH",
      body: JSON.stringify({
        trust_level,
        trust_score: scoreByLevel[trust_level],
      }),
    });
    emit();
  },

  assignCourier(deliveryId: string, courierId: string) {
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) =>
        d.id === deliveryId
          ? { ...d, courier_id: courierId, status: "assigned" }
          : d,
      ),
    );
    this.addAudit("Assigned courier to delivery", { deliveryId, courierId });
    commitRemote(`/deliveries/${deliveryId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ courier_id: courierId }),
    });
    emit();
  },

  setDeliveryStatus(deliveryId: string, status: DeliveryStatus) {
    replaceArray(
      state.deliveries,
      state.deliveries.map((d) => (d.id === deliveryId ? { ...d, status } : d)),
    );
    if (status === "delivered") {
      replaceArray(
        state.payments,
        state.payments.map((p) =>
          p.delivery_id === deliveryId ? { ...p, status: "paid" } : p,
        ),
      );
    }
    if (status === "cancelled") {
      replaceArray(
        state.payments,
        state.payments.map((p) =>
          p.delivery_id === deliveryId && p.status === "pending"
            ? { ...p, status: "failed" }
            : p,
        ),
      );
    }
    this.addAudit(`Set delivery status to ${status}`, { deliveryId, status });
    commitRemote(`/deliveries/${deliveryId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    emit();
  },

  async setPaymentStatus(paymentId: string, status: Payment["status"]) {
    const payment = await apiFetch<Payment>(`/payments/${paymentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refreshAfterMutation();
    return payment;
  },

  async setWithdrawalStatus(
    id: string,
    status: Exclude<Withdrawal["status"], "pending">,
  ) {
    const withdrawal = await apiFetch<Withdrawal>(`/withdrawals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refreshAfterMutation();
    return withdrawal;
  },

  setDisputeStatus(id: string, status: Dispute["status"]) {
    replaceArray(
      state.disputes,
      state.disputes.map((d) => (d.id === id ? { ...d, status } : d)),
    );
    this.addAudit(`Set dispute status to ${status}`, { id, status });
    commitRemote(`/disputes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    emit();
  },

  setTicketStatus(id: string, status: Ticket["status"]) {
    replaceArray(
      state.tickets,
      state.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
    );
    this.addAudit(`Set support ticket status to ${status}`, { id, status });
    commitRemote(`/support/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    emit();
  },

  savePricingSettings(pricing: AdminSettings["pricing"]) {
    state.settings = { ...state.settings, pricing };
    this.addAudit("Updated pricing settings", pricing);
    commitRemote("/admin/settings/pricing", {
      method: "PATCH",
      body: JSON.stringify(pricing),
    });
    emit();
  },

  saveTrustCaps(trust_caps: AdminSettings["trust_caps"]) {
    state.settings = { ...state.settings, trust_caps };
    this.addAudit("Updated trust level limits", trust_caps);
    commitRemote("/admin/settings/trust-caps", {
      method: "PATCH",
      body: JSON.stringify(trust_caps),
    });
    emit();
  },
};

const shallowEqual = (a: unknown, b: unknown) => {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, index) => Object.is(item, b[index]))
    );
  }
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    Object.getPrototypeOf(a) === Object.prototype &&
    Object.getPrototypeOf(b) === Object.prototype
  ) {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    return (
      aKeys.length === bKeys.length &&
      aKeys.every((key) =>
        Object.is(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
      )
    );
  }
  return false;
};

const cloneSnapshotValue = <T>(value: T): T => {
  if (Array.isArray(value)) return [...value] as T;
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return { ...(value as Record<string, unknown>) } as T;
  }
  return value;
};

export function useStore<T>(selector: (s: State) => T): T {
  const snapshotRef = useRef<T | undefined>(undefined);
  const versionRef = useRef(-1);

  const getSnapshot = useCallback(() => {
    if (
      snapshotRef.current !== undefined &&
      versionRef.current === storeVersion
    ) {
      return snapshotRef.current;
    }

    const selected = selector(state);
    const next = cloneSnapshotValue(selected);

    const selectedIsMutable = Boolean(
      selected &&
      typeof selected === "object" &&
      (Array.isArray(selected) ||
        Object.getPrototypeOf(selected) === Object.prototype),
    );

    if (
      !selectedIsMutable &&
      snapshotRef.current !== undefined &&
      shallowEqual(snapshotRef.current, next)
    ) {
      versionRef.current = storeVersion;
      return snapshotRef.current;
    }

    snapshotRef.current = next;
    versionRef.current = storeVersion;
    return next;
  }, [selector]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export const useSession = () => useStore((s) => s.session);
