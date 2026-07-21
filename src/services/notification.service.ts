import { http } from "@/services/http";
import type {
  NotificationListParams,
  NotificationRecord,
  NotificationUnreadCount,
  PaginatedNotifications,
} from "@/types/notification";

const buildQueryString = (params: NotificationListParams = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const notificationService = {
  list: (params?: NotificationListParams) =>
    http<PaginatedNotifications>(
      `/notifications${buildQueryString(params)}`,
      {},
    ),

  unreadCount: () =>
    http<NotificationUnreadCount>("/notifications/unread-count", {}),

  markRead: (id: string) =>
    http<NotificationRecord>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllRead: () =>
    http<{ updated_count: number }>("/notifications/read-all", {
      method: "PATCH",
    }),

  clearRead: () =>
    http<{ deleted_count: number }>("/notifications/clear-read", {
      method: "PATCH",
    }),
};
