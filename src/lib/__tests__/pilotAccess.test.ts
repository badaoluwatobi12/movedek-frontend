import { describe, expect, it } from "vitest";
import type { User } from "@/lib/types";
import { getPilotAccessStatus } from "../pilotAccess";

const user = (patch: Partial<User> = {}): User => ({
  id: "user_1",
  full_name: "Test User",
  email: "test@example.com",
  phone: "08000000000",
  role: "customer",
  status: "active",
  created_at: new Date(0).toISOString(),
  ...patch,
});

describe("getPilotAccessStatus", () => {
  it("marks granted users as approved", () => {
    expect(getPilotAccessStatus(user({ pilot_access: true }))).toBe("approved");
  });

  it("distinguishes revoked users from users awaiting approval", () => {
    expect(
      getPilotAccessStatus(
        user({ pilot_access: false, pilot_access_revoked_at: new Date().toISOString() }),
      ),
    ).toBe("revoked");
    expect(getPilotAccessStatus(user({ pilot_access: false }))).toBe("pending");
  });

  it("does not apply pilot access to admins", () => {
    expect(getPilotAccessStatus(user({ role: "admin" }))).toBe("not_applicable");
  });
});
