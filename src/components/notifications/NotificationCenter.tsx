import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellRing,
  CheckCheck,
  ExternalLink,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationUnreadCount,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { NotificationRecord } from "@/types/notification";

const alertPreferenceKey = "movedek_browser_alerts";

const relativeTime = (value: string) => {
  const diff = Math.max(0, Date.now() - Date.parse(value));
  if (diff < 60_000) return "Now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
};

function AlertRow({
  item,
  close,
}: {
  item: NotificationRecord;
  close: () => void;
}) {
  const markRead = useMarkNotificationRead();
  const unread = !item.read_at;
  const body = (
    <div
      className={cn(
        "group flex gap-3 rounded-xl p-3 transition hover:bg-muted/70",
        unread && "bg-primary/[0.06]",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          unread
            ? "bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
            : "bg-muted-foreground/25",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
          {item.priority === "critical" && <span className="rounded bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase text-destructive-foreground">Critical</span>}
          {item.priority === "high" && <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warning-foreground">High</span>}
          <p
            className={cn(
              "truncate text-sm",
              unread ? "font-semibold text-foreground" : "font-medium",
            )}
          >
            {item.title}
          </p>
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {relativeTime(item.created_at)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {item.message}
        </p>
      </div>
    </div>
  );

  if (!item.action_url) {
    return (
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => unread && markRead.mutate(item.id)}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      to={item.action_url}
      onClick={() => {
        if (unread) markRead.mutate(item.id);
        close();
      }}
      className="block"
    >
      {body}
    </Link>
  );
}

export default function NotificationCenter({
  notificationPath,
}: {
  notificationPath: string;
}) {
  const [open, setOpen] = useState(false);
  const unreadQuery = useNotificationUnreadCount();
  const recentQuery = useNotifications({
    read_status: "all",
    page: 1,
    limit: 6,
  });
  const markAll = useMarkAllNotificationsRead();
  const previousUnread = useRef<number | null>(null);
  const unread = unreadQuery.data?.unread_count ?? 0;

  useEffect(() => {
    const previous = previousUnread.current;
    previousUnread.current = unread;
    if (previous === null || unread <= previous) return;

    const newest = recentQuery.data?.items.find((item) => !item.read_at);
    if (newest) toast.info(newest.title, { description: newest.message });

    const browserAlerts =
      localStorage.getItem(alertPreferenceKey) === "enabled";
    if (
      browserAlerts &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      newest
    ) {
      new Notification(newest.title, { body: newest.message, tag: newest.id });
    }
  }, [recentQuery.data?.items, unread]);

  const enableBrowserAlerts = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser alerts are not supported on this device.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem(alertPreferenceKey, "enabled");
      toast.success("Browser alerts enabled");
      return;
    }
    toast.error("Browser notification permission was not granted.");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl"
          aria-label="Open alerts"
        >
          {unread ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-card">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-1rem))] overflow-hidden p-0 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="font-display font-semibold">Alerts</div>
            <div className="text-xs text-muted-foreground">
              {unread
                ? `${unread} unread update${unread === 1 ? "" : "s"}`
                : "You are all caught up"}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={!unread || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Read all
          </Button>
        </div>
        <Separator />
        <ScrollArea className="max-h-[22rem]">
          <div className="space-y-1 p-2">
            {recentQuery.isLoading && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Loading alerts…
              </p>
            )}
            {!recentQuery.isLoading && !recentQuery.data?.items.length && (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-7 w-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">No alerts yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Delivery and payment updates will appear here.
                </p>
              </div>
            )}
            {recentQuery.data?.items.map((item) => (
              <AlertRow
                key={item.id}
                item={item}
                close={() => setOpen(false)}
              />
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="grid grid-cols-2 gap-2 p-3">
          <Button variant="outline" size="sm" onClick={enableBrowserAlerts}>
            <Settings2 className="mr-1.5 h-4 w-4" />
            Browser alerts
          </Button>
          <Button asChild size="sm" onClick={() => setOpen(false)}>
            <Link to={notificationPath}>
              View all <ExternalLink className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
