import { describe, expect, it, beforeEach } from "vitest";
import {
  clearStoredAuth,
  getStoredAuthUser,
  getStoredSession,
  getStoredToken,
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

describe("authStorage — single source of truth for session persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a saved session across every role", () => {
    for (const role of ["customer", "courier", "merchant", "admin"] as const) {
      window.localStorage.clear();
      const user = makeUser({ id: `user-${role}`, role });

      saveStoredAuth(user, "fake.jwt.token");

      expect(getStoredToken()).toBe("fake.jwt.token");
      expect(getStoredSession()).toEqual({ userId: user.id, role });
      expect(getStoredAuthUser()?.id).toBe(user.id);
      expect(getStoredAuthUser()?.role).toBe(role);
    }
  });

  it("writes both the SendAm and legacy Venuedek-style localStorage keys", () => {
    saveStoredAuth(makeUser(), "fake.jwt.token");

    expect(window.localStorage.getItem("sendam_auth_token")).toBe("fake.jwt.token");
    expect(window.localStorage.getItem("token")).toBe("fake.jwt.token");
    expect(window.localStorage.getItem("sendam_auth_session")).toBeTruthy();
    expect(window.localStorage.getItem("user")).toBeTruthy();
  });

  it("clearStoredAuth removes every key so no session survives", () => {
    saveStoredAuth(makeUser(), "fake.jwt.token");
    clearStoredAuth();

    expect(getStoredToken()).toBeNull();
    expect(getStoredSession()).toBeNull();
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("user")).toBeNull();
  });

  it("recovers a session from only the legacy Venuedek 'user' key (no explicit session key)", () => {
    window.localStorage.setItem("token", "fake.jwt.token");
    window.localStorage.setItem(
      "user",
      JSON.stringify({ id: "merchant-1", role: "merchant", full_name: "Chidi Store" }),
    );

    expect(getStoredSession()).toEqual({ userId: "merchant-1", role: "merchant" });
  });

  it("treats a malformed stored session as logged out rather than throwing", () => {
    window.localStorage.setItem("token", "fake.jwt.token");
    window.localStorage.setItem("sendam_auth_session", "not-json");
    window.localStorage.setItem("user", "not-json");

    expect(() => getStoredSession()).not.toThrow();
  });
});
