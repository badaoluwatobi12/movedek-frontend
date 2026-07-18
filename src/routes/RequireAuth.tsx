import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredToken, isTokenValid } from "@/lib/authStorage";

export default function RequireAuth() {
  const location = useLocation();
  const token = getStoredToken();

  // Hard rule: only send the user to login when there is no token at all.
  // Do not clear localStorage during page refresh because that was causing
  // valid sessions to be destroyed before the app finished restoring state.
  if (!token || !isTokenValid(token)) {
    const next = `${location.pathname}${location.search || ""}`;
    return <Navigate to={`/auth/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
