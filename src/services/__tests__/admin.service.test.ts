import { afterEach, describe, expect, it, vi } from "vitest";
import { adminService } from "../admin.service";

afterEach(() => {
  vi.unstubAllGlobals();
});

function successfulResponse() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "ok",
      data: {
        user_id: "user_1",
        pilot_access: true,
        pilot_access_status: "approved",
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("adminService pilot access", () => {
  it("uses the protected pilot grant endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);
    await adminService.grantPilotAccess("user_1");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pilot/admin/access/user_1"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("uses DELETE to revoke pilot access", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);
    await adminService.revokePilotAccess("user_1");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pilot/admin/access/user_1"),
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });
});
