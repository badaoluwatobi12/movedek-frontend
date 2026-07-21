import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredAuth,
  getStoredAuthUser,
  getStoredSession,
  isTokenValid,
  saveStoredAuth,
} from "@/lib/authStorage";
import type { User } from "@/lib/types";

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  full_name: "Ada Courier",
  email: "ada@example.com",
  phone: "+2348012345678",
  role: "courier",
  status: "active",
  created_at: new Date().toISOString(),
  ...overrides,
});

const base64Url = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const unsignedJwt = (payload: object) =>
  `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url(payload)}.signature`;

describe("authStorage — cookie-authenticated browser session cache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips the non-sensitive session cache across every role", () => {
    for (const role of ["customer", "courier", "merchant", "admin"] as const) {
      window.localStorage.clear();
      const user = makeUser({ id: `user-${role}`, role });

      saveStoredAuth(user);

      expect(getStoredSession()).toEqual({ userId: user.id, role });
      expect(getStoredAuthUser()?.id).toBe(user.id);
      expect(getStoredAuthUser()?.role).toBe(role);
      expect(window.localStorage.getItem("movedek_auth_token")).toBeNull();
    }
  });

  it("writes only cookie-safe MoveDek session and user keys", () => {
    saveStoredAuth(makeUser());

    expect(window.localStorage.getItem("movedek_auth_session")).toBeTruthy();
    expect(window.localStorage.getItem("movedek_auth_user")).toBeTruthy();
    expect(window.localStorage.getItem("movedek_auth_token")).toBeNull();
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("sendam_auth_token")).toBeNull();
  });

  it("clearStoredAuth removes canonical and legacy browser auth data", () => {
    saveStoredAuth(makeUser());
    window.localStorage.setItem("token", "legacy-token");
    window.localStorage.setItem("sendam_auth_token", "legacy-token");

    clearStoredAuth();

    expect(getStoredSession()).toBeNull();
    expect(window.localStorage.getItem("movedek_auth_user")).toBeNull();
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("sendam_auth_token")).toBeNull();
  });

  it("migrates a legacy user cache but discards its readable token", () => {
    window.localStorage.setItem("token", "legacy.jwt.token");
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        id: "merchant-1",
        role: "merchant",
        full_name: "Chidi Store",
      }),
    );

    expect(getStoredSession()).toEqual({
      userId: "merchant-1",
      role: "merchant",
    });
    expect(window.localStorage.getItem("movedek_auth_session")).toBeTruthy();
    expect(window.localStorage.getItem("movedek_auth_token")).toBeNull();
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("user")).toBeNull();
  });

  it("treats a malformed stored session as logged out rather than throwing", () => {
    window.localStorage.setItem("movedek_auth_session", "not-json");
    expect(() => getStoredSession()).not.toThrow();
    expect(getStoredSession()).toBeNull();
  });

  it("rejects malformed, expiry-free, and expired JWTs", () => {
    expect(isTokenValid("fake.jwt.token")).toBe(false);
    expect(isTokenValid(unsignedJwt({ sub: "user-1" }))).toBe(false);
    expect(
      isTokenValid(
        unsignedJwt({ sub: "user-1", exp: Math.floor(Date.now() / 1000) - 60 }),
      ),
    ).toBe(false);
  });

  it("accepts a correctly shaped unexpired JWT", () => {
    expect(
      isTokenValid(
        unsignedJwt({
          sub: "user-1",
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ),
    ).toBe(true);
  });
});
