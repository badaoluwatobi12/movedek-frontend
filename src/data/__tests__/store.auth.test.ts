import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/lib/types";

const courier: User = {
  id: "courier-user-1",
  full_name: "Ada Courier",
  email: "ada@example.com",
  phone: "+2348012345678",
  role: "courier",
  status: "active",
  created_at: "2026-07-20T00:00:00.000Z",
};

describe("store authentication hydration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("does not resolve login until the protected courier snapshot is hydrated", async () => {
    let releaseSnapshot: (() => void) | undefined;
    const snapshotGate = new Promise<void>((resolve) => {
      releaseSnapshot = resolve;
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/auth/login")) {
        return new Response(
          JSON.stringify({ data: { user: courier, token: "development.token.value" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/app-state")) {
        await snapshotGate;
        return new Response(
          JSON.stringify({
            data: {
              users: [courier],
              couriers: [
                {
                  id: "courier-1",
                  user_id: courier.id,
                  verification_status: "approved",
                  trust_level: "bronze",
                  trust_score: 50,
                  is_online: false,
                  completed: 0,
                  rating: 5,
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Unexpected request: ${url} ${String(init?.method ?? "GET")}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    const { store } = await import("@/data/store");

    let resolved = false;
    const login = store.loginWithCredentials("  ADA@EXAMPLE.COM ", "password").then((user) => {
      resolved = true;
      return user;
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(resolved).toBe(false);

    releaseSnapshot?.();
    await expect(login).resolves.toMatchObject({ id: courier.id, role: "courier" });
    expect(store.getState().couriers[0]?.user_id).toBe(courier.id);

    const loginBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(loginBody.email).toBe("ada@example.com");
  });
});
