import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const storedUser = getStoredAuthUser();
  const storedUserId = session?.userId;
  const storedRole = session?.role;

  const currentPageTitle = useMemo(() => {
    const exactMatch = nav.find((item) => item.to === location.pathname);
    const nestedMatch = [...nav]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => location.pathname.startsWith(`${item.to}/`));
    return exactMatch?.label ?? nestedMatch?.label ?? title;
  }, [location.pathname, nav, title]);

  useEffect(() => {
    document.title = `${currentPageTitle} | MoveDek`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileNavOpen(false);
  }, [location.pathname, currentPageTitle]);

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
    <aside className="flex h-full w-[86vw] max-w-[21rem] shrink-0 flex-col bg-sidebar text-sidebar-foreground shadow-2xl md:w-64 md:max-w-none md:shadow-none">
      <Link to="/" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 border-b border-sidebar-border/70 px-5 py-5">
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
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
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
            type="button"
            aria-label="Log out"
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-card/95 px-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="md:hidden">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" aria-label="Open navigation">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[86vw] max-w-[21rem] border-0 p-0 [&>button]:right-4 [&>button]:top-4 [&>button]:text-sidebar-foreground">
                  {Sidebar}
                </SheetContent>
              </Sheet>
            </div>
            <div className="min-w-0">
              <p className="hidden text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground sm:block md:hidden">MoveDek</p>
              <h1 className="truncate font-display text-base font-semibold text-foreground sm:text-lg">{currentPageTitle}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button asChild variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
              <Link to={notificationPath} aria-label="Open notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-card">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <Link
              to={role === "customer" ? "/app/profile" : `/${role}/profile`}
              className="grid h-10 w-10 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open profile"
            >
              {displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full min-w-0 max-w-[1440px]">
            <div className="mb-4 sm:mb-6"><ConnectivityAlert /></div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
