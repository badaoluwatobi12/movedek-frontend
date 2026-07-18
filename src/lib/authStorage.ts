import type { Role, User } from "@/lib/types";

export type StoredAuthSession = {
  userId: string;
  role: Role;
};

const SENDAM_TOKEN_KEY = "sendam_auth_token";
const SENDAM_SESSION_KEY = "sendam_auth_session";
const VENUEDEK_TOKEN_KEY = "token";
const VENUEDEK_USER_KEY = "user";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function storage() {
  if (!isBrowser()) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clean(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();

  if (!trimmed || ["null", "undefined", '""', "''"].includes(trimmed)) {
    return null;
  }

  return trimmed;
}

function readJson(value: string | null): Record<string, unknown> | null {
  const cleaned = clean(value);
  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

    return atob(padded);
  } catch {
    return null;
  }
}

function getJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    if (!payload) return null;

    const decoded = decodeBase64Url(payload);
    if (!decoded) return null;

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeRole(value: unknown): Role | null {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (role === "customer" || role === "courier" || role === "merchant" || role === "admin") return role;
  if (role === "user" || role === "client") return "customer";
  if (role === "rider" || role === "driver") return "courier";
  if (role === "vendor" || role === "partner" || role === "owner" || role === "business") return "merchant";

  return null;
}

export function getStoredToken() {
  const store = storage();
  if (!store) return null;

  return clean(store.getItem(VENUEDEK_TOKEN_KEY)) ?? clean(store.getItem(SENDAM_TOKEN_KEY));
}

function sessionFromSendamKey(): StoredAuthSession | null {
  const store = storage();
  if (!store) return null;

  const parsed = readJson(store.getItem(SENDAM_SESSION_KEY));
  if (!parsed) return null;

  const userId = String(parsed.userId ?? parsed.id ?? parsed.sub ?? "").trim();
  const role = normalizeRole(parsed.role);

  if (!userId || !role) return null;

  return { userId, role };
}

function sessionFromVenuedekKey(): StoredAuthSession | null {
  const store = storage();
  if (!store) return null;

  const parsed = readJson(store.getItem(VENUEDEK_USER_KEY));
  if (!parsed) return null;

  const userId = String(parsed.id ?? parsed.sub ?? parsed.userId ?? "").trim();
  const role = normalizeRole(parsed.role);

  if (!userId || !role) return null;

  return { userId, role };
}

function sessionFromToken(token: string): StoredAuthSession | null {
  const payload = getJwtPayload(token);
  if (!payload) return null;

  const userId = String(payload.sub ?? payload.id ?? payload.userId ?? "").trim();
  const role = normalizeRole(payload.role) ?? "customer";

  if (!userId) return null;

  return { userId, role };
}

function userFromToken(token: string): Partial<User> | null {
  const payload = getJwtPayload(token);
  if (!payload) return null;

  const userId = String(payload.sub ?? payload.id ?? payload.userId ?? "").trim();
  if (!userId) return null;

  const email = String(payload.email ?? "")
    .trim()
    .toLowerCase();
  const role = normalizeRole(payload.role) ?? "customer";

  return {
    id: userId,
    full_name: email || "SendAm User",
    email,
    phone: "",
    role,
    status: "active",
    created_at: new Date().toISOString(),
  };
}

function syncAuthAliases(token: string, session: StoredAuthSession, user?: Partial<User> | null) {
  const store = storage();
  if (!store) return;

  store.setItem(VENUEDEK_TOKEN_KEY, token);
  store.setItem(SENDAM_TOKEN_KEY, token);
  store.setItem(SENDAM_SESSION_KEY, JSON.stringify(session));

  const existingUser = readJson(store.getItem(VENUEDEK_USER_KEY));
  const finalUser = (user ?? existingUser ?? userFromToken(token)) as Record<string, unknown> | null;

  if (finalUser && (finalUser.id || finalUser.sub || finalUser.userId)) {
    const id = String(finalUser.id ?? finalUser.sub ?? finalUser.userId);
    const role = normalizeRole(finalUser.role) ?? session.role;

    store.setItem(
      VENUEDEK_USER_KEY,
      JSON.stringify({
        ...finalUser,
        id,
        sub: id,
        userId: id,
        role,
        name: String(finalUser.full_name ?? finalUser.name ?? finalUser.email ?? "SendAm User"),
      }),
    );
  }
}

export function getStoredAuthUser(): Partial<User> | null {
  const store = storage();
  if (!store) return null;

  const record = readJson(store.getItem(VENUEDEK_USER_KEY));
  if (!record) return null;

  const id = String(record.id ?? record.sub ?? record.userId ?? "").trim();
  if (!id) return null;

  const email = String(record.email ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(record.full_name ?? record.name ?? email ?? "SendAm User").trim();
  const role = normalizeRole(record.role) ?? "customer";

  return {
    id,
    full_name: fullName || "SendAm User",
    email,
    phone: String(record.phone ?? "").trim(),
    role,
    status: "active",
    created_at: String(record.created_at ?? new Date().toISOString()),
  };
}

export function getStoredSession(): StoredAuthSession | null {
  const token = getStoredToken();
  if (!token || !isTokenValid(token)) return null;

  const session = sessionFromVenuedekKey() ?? sessionFromSendamKey() ?? sessionFromToken(token);

  if (session) {
    syncAuthAliases(token, session);
  }

  return session;
}

export function saveStoredAuth(user: User, token: string) {
  const store = storage();
  if (!store) return;

  const role = normalizeRole(user.role) ?? "customer";
  const session: StoredAuthSession = { userId: user.id, role };
  const userForStorage = { ...user, id: user.id, sub: user.id, userId: user.id, role };

  syncAuthAliases(token, session, userForStorage);
}

export function clearStoredAuth() {
  const store = storage();
  if (!store) return;

  store.removeItem(VENUEDEK_TOKEN_KEY);
  store.removeItem(VENUEDEK_USER_KEY);
  store.removeItem(SENDAM_TOKEN_KEY);
  store.removeItem(SENDAM_SESSION_KEY);
}

export function isTokenValid(token: string | null) {
  if (!token) return false;

  const payload = getJwtPayload(token);

  // SendAm should always send JWTs, but this keeps local/dev tokens from causing a false logout.
  if (!payload) return true;

  if (typeof payload.exp !== "number") return true;

  const now = Math.floor(Date.now() / 1000);

  return payload.exp > now - 30;
}

export function getHomeForRole(role: Role) {
  if (role === "customer") return "/app";
  if (role === "courier") return "/courier";
  if (role === "merchant") return "/merchant";
  if (role === "admin") return "/admin";

  return "/app";
}

export function safeInternalNext(raw: string | null) {
  if (!raw) return null;

  let decoded = raw;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  if (decoded.startsWith("/api")) return null;

  return decoded;
}

export const SENDAM_AUTH_FIX_VERSION = "ctrlr-token-only-2026-07-09";
