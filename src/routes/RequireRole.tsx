import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/data/store";
import { getHomeForRole } from "@/lib/authStorage";
import type { Role } from "@/lib/types";

export default function RequireRole({ roles }: { roles: readonly Role[] }) {
  const session = useSession();
  if (!session) return null;
  if (!roles.includes(session.role)) {
    return <Navigate to={getHomeForRole(session.role)} replace />;
  }
  return <Outlet />;
}
