import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession, useStore } from "@/data/store";

export default function RequireAuth() {
  const location = useLocation();
  const session = useSession();
  const loading = useStore((state) => state.loading);

  // Authentication is restored from the HttpOnly cookie through /auth/me.
  // Never trust localStorage alone when deciding whether a protected route can render.
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Restoring your MoveDek session…
      </div>
    );
  }

  if (!session) {
    const next = `${location.pathname}${location.search || ""}`;
    return (
      <Navigate to={`/auth/login?next=${encodeURIComponent(next)}`} replace />
    );
  }

  return <Outlet />;
}
