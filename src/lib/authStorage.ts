import type { Role, User } from "@/lib/types";

export type StoredAuthSession = {
  userId: string;
  role: Role;
};

const MOVEDEK_SESSION_KEY = "movedek_auth_session";
const MOVEDEK_USER_KEY = "movedek_auth_user";
const MOVEDEK_TOKEN_KEY = "movedek_auth_token";
const LEGACY_SENDAM_TOKEN_KEY = "sendam_auth_token";
const LEGACY_SENDAM_SESSION_KEY = "sendam_auth_session";
const VENUEDEK_TOKEN_KEY = "token";
const VENUEDEK_USER_KEY = "user";

function isBrowser() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
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
  if (!trimmed || ["null", "undefined", '""', "''"].includes(trimmed))
    return null;
  return trimmed;
}

function readJson(value: string | null): Record<string, unknown> | null {
  const cleaned = clean(value);
  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
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

    const parsed = JSON.parse(decoded) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function normalizeRole(value: unknown): Role | null {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (
    role === "customer" ||
    role === "courier" ||
    role === "merchant" ||
    role === "admin"
  )
    return role;
  if (role === "user" || role === "client") return "customer";
  if (role === "rider" || role === "driver") return "courier";
  if (
    role === "vendor" ||
    role === "partner" ||
    role === "owner" ||
    role === "business"
  )
    return "merchant";

  return null;
}

function removeLegacyKeys(store: Storage) {
  // Web authentication is cookie-only. Remove all historical browser-readable
  // bearer tokens during migration.
  store.removeItem(MOVEDEK_TOKEN_KEY);
  store.removeItem(LEGACY_SENDAM_TOKEN_KEY);
  store.removeItem(LEGACY_SENDAM_SESSION_KEY);
  store.removeItem(VENUEDEK_TOKEN_KEY);
  store.removeItem(VENUEDEK_USER_KEY);
}

function persistCanonicalAuth(
  session: StoredAuthSession,
  user?: Partial<User> | null,
) {
  const store = storage();
  if (!store) return;

  store.setItem(MOVEDEK_SESSION_KEY, JSON.stringify(session));
  if (user) {
    store.setItem(
      MOVEDEK_USER_KEY,
      JSON.stringify({
        ...user,
        id: session.userId,
        role: session.role,
      }),
    );
  }

  removeLegacyKeys(store);
}

export function getStoredAuthUser(): Partial<User> | null {
  const store = storage();
  if (!store) return null;

  const record =
    readJson(store.getItem(MOVEDEK_USER_KEY)) ??
    readJson(store.getItem(VENUEDEK_USER_KEY));
  if (!record) return null;

  const id = String(record.id ?? record.sub ?? record.userId ?? "").trim();
  if (!id) return null;

  const email = String(record.email ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(
    record.full_name ?? record.name ?? email ?? "MoveDek User",
  ).trim();
  const role = normalizeRole(record.role) ?? "customer";

  return {
    id,
    full_name: fullName || "MoveDek User",
    email,
    phone: String(record.phone ?? "").trim(),
    role,
    status: "active",
    created_at: String(record.created_at ?? new Date().toISOString()),
  };
}

export function getStoredSession(): StoredAuthSession | null {
  const store = storage();
  if (!store) return null;

  const canonical = readJson(store.getItem(MOVEDEK_SESSION_KEY));
  const legacySession = readJson(store.getItem(LEGACY_SENDAM_SESSION_KEY));
  const legacyUser = readJson(store.getItem(VENUEDEK_USER_KEY));
  const record = canonical ?? legacySession ?? legacyUser;

  if (!record) {
    removeLegacyKeys(store);
    return null;
  }

  const userId = String(record.userId ?? record.id ?? record.sub ?? "").trim();
  const role = normalizeRole(record.role);
  if (!userId || !role) {
    clearStoredAuth();
    return null;
  }

  const session = { userId, role };
  persistCanonicalAuth(session, getStoredAuthUser());
  return session;
}

export function saveStoredAuth(user: User) {
  const role = normalizeRole(user.role) ?? "customer";
  persistCanonicalAuth({ userId: user.id, role }, user);
}

export function clearStoredAuth() {
  const store = storage();
  if (!store) return;

  store.removeItem(MOVEDEK_SESSION_KEY);
  store.removeItem(MOVEDEK_USER_KEY);
  removeLegacyKeys(store);
}

/**
 * Strict JWT shape/expiry validation retained for mobile/shared migration tests.
 * Malformed tokens and tokens without a numeric expiry are never accepted.
 */
export function isTokenValid(token: string | null) {
  if (!token) return false;
  const payload = getJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp > Math.floor(Date.now() / 1000) + 30;
}

export function getHomeForRole(role: Role) {
  if (role === "customer") return "/app";
  return `/${role}`;
}

export function safeInternalNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
