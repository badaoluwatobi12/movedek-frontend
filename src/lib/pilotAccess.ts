import type { User } from "@/lib/types";

export type PilotAccessStatus = "approved" | "pending" | "revoked" | "not_applicable";

export function getPilotAccessStatus(user: User): PilotAccessStatus {
  if (user.role === "admin") return "not_applicable";
  if (user.pilot_access === true || user.internal_tester === true) {
    return "approved";
  }
  return user.pilot_access_revoked_at ? "revoked" : "pending";
}
