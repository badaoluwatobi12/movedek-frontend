import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { getStoredAuthUser, store, useSession, useStore } from "@/data/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNotificationUnreadCount } from "@/hooks/useNotifications";
import { Bell, LogOut, Menu, Zap, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConnectivityAlert } from "@/components/common/ConnectivityAlert";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export function DashboardShell({
  role,
  nav,
  title,
}: {
  role: Role;
  nav: NavItem[];
  title: string;
}) {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = getStoredAuthUser();
  const storedUserId = session?.userId;
  const storedRole = session?.role;

  useEffect(() => {
    document.title = `${title} | MoveDek`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, title]);

  useEffect(() => {
    if (storedRole && storedRole !== role) {
      navigate(`/${storedRole === "customer" ? "app" : storedRole}`, {
        replace: true,
      });
    }
  }, [storedRole, role, navigate]);

  const user = useStore((s) =>
    session
      ? s.users.find((candidate) => candidate.id === session.userId)
      : undefined,
  );
  const displayName =
    user?.full_name || storedUser?.full_name || "MoveDek User";
  const displayEmail = user?.email || storedUser?.email || "";
  const unreadNotifications = useNotificationUnreadCount();
  const notificationPath =
    role === "customer" ? "/app/notifications" : `/${role}/notifications`;
  const unreadCount = unreadNotifications.data?.unread_count ?? 0;

  if (!session || !storedUserId || !storedRole) return null;

  const Sidebar = (
    <aside className="flex h-full w-[min(18rem,86vw)] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:w-64">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl accent-gradient shadow-glow">
          <Zap className="h-5 w-5 text-white" />
        </span>
        <div>
          <div className="font-display text-lg font-bold leading-none">
            MoveDek
          </div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
            {title}
          </div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                isActive
                  ? "bg-sidebar-accent text-white font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
              )
            }
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground font-semibold">
            {displayName
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{displayName}</div>
            <div className="truncate text-xs text-sidebar-foreground/60">
              {displayEmail}
            </div>
          </div>
          <button
            title="Log out"
            onClick={() => {
              store.logout();
              navigate("/");
            }}
            className="rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block">{Sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b border-border/60 bg-card/90 px-3 py-2 backdrop-blur sm:px-4">
          <div className="flex items-center gap-3 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(18rem,86vw)] p-0">
                {Sidebar}
              </SheetContent>
            </Sheet>
            <span className="font-display font-semibold text-primary">
              MoveDek
            </span>
          </div>
          <div className="hidden md:block text-sm text-muted-foreground capitalize">
            {title}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to={notificationPath} aria-label="Open notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-[1600px]">
            <div className="mb-4 sm:mb-5"><ConnectivityAlert /></div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
