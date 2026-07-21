import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/data/store";
import { notificationService } from "@/services/notification.service";
import type { NotificationListParams } from "@/types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params?: NotificationListParams) =>
    [...notificationKeys.lists(), params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useNotifications(params?: NotificationListParams) {
  const session = useSession();
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.list(params),
    enabled: Boolean(session),
    refetchInterval: 60_000,
  });
}

export function useNotificationUnreadCount() {
  const session = useSession();
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.unreadCount(),
    enabled: Boolean(session),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useClearReadNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.clearRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
