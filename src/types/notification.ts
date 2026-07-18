export type NotificationCategory =
  "delivery" | "payment" | "refund" | "dispute" | "wallet" | "security" | "admin" | "system";

export type NotificationKind = "info" | "success" | "warning" | "danger" | "action";
export type NotificationReadStatus = "all" | "unread" | "read";

export interface NotificationRecord {
  id: string;
  user_id: string;
  actor_id: string | null;
  title: string;
  message: string;
  category: NotificationCategory;
  kind: NotificationKind;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListParams {
  read_status?: NotificationReadStatus;
  category?: NotificationCategory;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  items: NotificationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  unread_count: number;
}

export interface NotificationUnreadCount {
  unread_count: number;
}
