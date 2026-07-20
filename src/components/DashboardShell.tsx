import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { getStoredAuthUser, store, useSession, useStore } from "@/data/store";
import { getStoredSession as getStorageSession, getStoredToken } from "@/lib/authStorage";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMarkAllNotificationsRead, useNotificationUnreadCount, useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, LogOut, Menu, Settings, Zap, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

export function DashboardShell({ role, nav, title }: { role: Role; nav: NavItem[]; title: string }) {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const token = getStoredToken();
  const storedUser = getStoredAuthUser();
  const storedSession =
    session ??
    store.getStoredSession() ??
    getStorageSession() ??
    (token
      ? {
          userId: storedUser?.id || "authenticated-user",
          role,
        }
      : null);
  const storedUserId = storedSession?.userId;
  const storedRole = storedSession?.role;

  useEffect(() => {
    if (!token || !storedUserId || !storedRole) {
      const next = `${location.pathname}${location.search || ""}`;
      navigate(`/auth/login?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }

    if (storedRole !== role) {
      navigate(`/${storedRole === "customer" ? "app" : storedRole}`, { replace: true });
    }
  }, [token, storedUserId, storedRole, role, navigate, location.pathname, location.search]);

  const user = useStore((s) =>
    storedSession ? s.users.find((u) => u.id === storedSession.userId) : undefined,
  );
  const displayName = user?.full_name || storedUser?.full_name || "MoveDek User";
  const displayEmail = user?.email || storedUser?.email || "";
  const unreadNotifications = useNotificationUnreadCount();
  const recentNotifications = useNotifications({ read_status: "all", page: 1, limit: 5 });
  const markAllRead = useMarkAllNotificationsRead();
  const notificationPath = role === "customer" ? "/app/notifications" : `/${role}/notifications`;
  const unreadCount = unreadNotifications.data?.unread_count ?? 0;
  const previousUnread = useRef<number | null>(null);

  useEffect(() => {
    if (previousUnread.current !== null && unreadCount > previousUnread.current) {
      const latest = recentNotifications.data?.items.find((item) => !item.read_at);
      toast.info(latest?.title ?? "You have a new MoveDek alert", {
        description: latest?.message,
        action: latest?.action_url
          ? { label: "Open", onClick: () => navigate(latest.action_url!) }
          : undefined,
      });

      if (document.visibilityState !== "visible" && Notification.permission === "granted") {
        new Notification(latest?.title ?? "New MoveDek alert", { body: latest?.message });
      }
    }
    previousUnread.current = unreadCount;
  }, [navigate, recentNotifications.data?.items, unreadCount]);

  if (!storedSession || !token) return null;

  const Sidebar = (
    <aside className="flex h-full w-[min(18rem,86vw)] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:w-64">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl accent-gradient shadow-glow">
          <Zap className="h-5 w-5 text-white" />
        </span>
        <div>
          <div className="font-display text-lg font-bold leading-none">MoveDek</div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">{title}</div>
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
            <div className="truncate text-xs text-sidebar-foreground/60">{displayEmail}</div>
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
            <span className="font-display font-semibold text-primary">MoveDek</span>
          </div>
          <div className="hidden md:block text-sm text-muted-foreground capitalize">{title}</div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Open notification alerts">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1rem))] p-0">
                <div className="flex items-center justify-between border-b p-3">
                  <div>
                    <div className="font-display font-semibold text-primary">Alerts</div>
                    <div className="text-xs text-muted-foreground">{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</div>
                  </div>
                  {unreadCount > 0 && (
                    <Button size="sm" variant="ghost" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
                      <CheckCheck className="mr-1 h-4 w-4" /> Read all
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {recentNotifications.isLoading && <div className="p-4 text-sm text-muted-foreground">Loading alerts…</div>}
                  {recentNotifications.data?.items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No alerts yet.</div>}
                  {recentNotifications.data?.items.map((item) => (
                    <Link key={item.id} to={item.action_url || notificationPath} className="block rounded-lg p-3 hover:bg-muted/70">
                      <div className="flex gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-muted-foreground/30" : "bg-primary"}`} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-primary">{item.title}</div>
                          <div className="line-clamp-2 text-xs text-muted-foreground">{item.message}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t p-2">
                  <Button asChild variant="ghost" size="sm"><Link to={notificationPath}>View all</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (!("Notification" in window)) return toast.error("Browser notifications are not supported.");
                    void Notification.requestPermission().then((permission) => {
                      if (permission === "granted") {
                        toast.success("Browser alerts enabled");
                      } else {
                        toast.info("Browser alerts remain disabled");
                      }
                    });
                  }}><Settings className="mr-1 h-4 w-4" /> Browser alerts</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
