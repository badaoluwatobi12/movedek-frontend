import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Inbox, Search, Trash2, ShieldCheck, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import {
  useClearReadNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { NotificationCategory, NotificationReadStatus, NotificationRecord } from "@/types/notification";

const filters: { label: string; value: NotificationReadStatus }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
];

const categoryTone: Record<NotificationCategory, string> = {
  delivery: "bg-primary/10 text-primary border-primary/20",
  payment: "bg-success/10 text-success border-success/20",
  refund: "bg-warning/15 text-warning-foreground border-warning/25",
  dispute: "bg-destructive/10 text-destructive border-destructive/20",
  wallet: "bg-accent/10 text-accent border-accent/20",
  security: "bg-destructive/10 text-destructive border-destructive/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  system: "bg-muted text-muted-foreground border-border",
};

function timeAgo(input: string) {
  const diff = Date.now() - Date.parse(input);
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

function NotificationItem({ notification }: { notification: NotificationRecord }) {
  const markRead = useMarkNotificationRead();
  const isUnread = !notification.read_at;

  const content = (
    <Card
      className={cn(
        "transition hover:border-primary/30",
        isUnread ? "border-primary/30 bg-primary/[0.03] shadow-sm" : "bg-card",
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("capitalize", categoryTone[notification.category])}>
                {notification.category}
              </Badge>
              {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
              <span className="text-xs text-muted-foreground">{timeAgo(notification.created_at)}</span>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-primary">{notification.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {notification.action_url && (
              <Button asChild size="sm" variant={isUnread ? "default" : "outline"}>
                <Link to={notification.action_url}>Open</Link>
              </Button>
            )}
            {isUnread && (
              <Button
                size="sm"
                variant="ghost"
                disabled={markRead.isPending}
                onClick={() => markRead.mutate(notification.id)}
              >
                Mark read
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return content;
}

export default function NotificationsPage() {
  const [readStatus, setReadStatus] = useState<NotificationReadStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(
    () => ({ read_status: readStatus, search: search.trim() || undefined, page, limit: 20 }),
    [page, readStatus, search],
  );

  const notifications = useNotifications(params);
  const markAllRead = useMarkAllNotificationsRead();
  const clearRead = useClearReadNotifications();
  const data = notifications.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <PageHeader
          title="Notifications"
          subtitle="Delivery, payment, refund, dispute, wallet, and admin updates in one place."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={markAllRead.isPending || !data?.unread_count}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Button variant="outline" disabled={clearRead.isPending} onClick={() => clearRead.mutate()}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear read
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search notifications"
            className="pl-9"
          />
        </div>
        <div className="flex rounded-xl border bg-card p-1">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={readStatus === filter.value ? "default" : "ghost"}
              onClick={() => {
                setReadStatus(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-950 to-emerald-700 p-5 text-white shadow-sm">
          <PackageCheck className="h-5 w-5 text-emerald-200" />
          <span className="mt-4 block text-sm text-white/70">Total alerts</span>
          <div className="font-display text-3xl font-bold">{data?.pagination.total ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <Bell className="h-5 w-5 text-primary" />
          <span className="mt-4 block text-sm text-muted-foreground">Unread alerts</span>
          <div className="font-display text-3xl font-bold text-primary">{data?.unread_count ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="mt-4 block text-sm text-muted-foreground">Alert center</span>
          <div className="mt-1 text-sm font-medium text-foreground">Delivery, payout and account updates</div>
        </div>
      </div>

      {notifications.isLoading && <LoadingState label="Loading notifications…" />}

      {notifications.isError && (
        <EmptyState
          icon={Bell}
          title="Could not load notifications"
          desc={
            notifications.error instanceof Error
              ? notifications.error.message
              : "Please refresh and try again."
          }
        />
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No notifications yet"
          desc="Important MoveDek updates will appear here."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.items.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}

      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border bg-card p-3">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.total_pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.total_pages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
