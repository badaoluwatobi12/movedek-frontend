export type DisputeStatus = "open" | "reviewing" | "resolved" | "rejected";

export interface DisputeRecord {
  id: string;
  delivery_id: string;
  payment_id: string | null;
  opened_by: string;
  assigned_admin_id: string | null;
  reason: string;
  details: string | null;
  status: DisputeStatus;
  resolution: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface PaginatedDisputes {
  items: DisputeRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface DisputeListParams {
  status?: DisputeStatus;
  delivery_id?: string;
  user_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDisputePayload {
  delivery_id: string;
  reason: string;
  details?: string;
}

export interface UpdateDisputePayload {
  status?: DisputeStatus;
  assigned_admin_id?: string;
  resolution?: string;
  refund_amount?: number;
}

export const disputeStatuses: DisputeStatus[] = ["open", "reviewing", "resolved", "rejected"];
