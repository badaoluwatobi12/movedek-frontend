export type DeliveryCategory =
  "food" | "groceries" | "pharmacy" | "parcel" | "personal_pickup" | "buy_for_me" | "business";

export type CourierType = "everyday" | "motorcycle" | "car" | "van" | "logistics";

export type DeliveryStatus =
  | "pending"
  | "searching"
  | "assigned"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type PackageSize = "small" | "medium" | "large" | "xl" | "bulk";

export interface DeliveryRecord {
  id: string;
  customer_id: string;
  courier_id: string | null;
  merchant_id: string | null;
  category: DeliveryCategory;
  pickup_address: string;
  pickup_contact: string;
  pickup_phone: string;
  pickup_notes: string | null;
  dropoff_address: string;
  dropoff_contact: string;
  dropoff_phone: string;
  dropoff_notes: string | null;
  item_name: string;
  item_value: number;
  package_size: PackageSize;
  fragile: boolean;
  delivery_notes: string | null;
  courier_type: CourierType;
  risk_level: RiskLevel;
  status: DeliveryStatus;
  price: number;
  courier_payout: number;
  protection: boolean;
  pickup_pin: string;
  dropoff_pin: string;
  distance_km: number;
  created_at: string;
  updated_at: string;
  pickup_confirmed_at: string | null;
  transit_started_at: string | null;
  delivery_confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface PaginatedDeliveries {
  items: DeliveryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export type CourierDeliveryScope = "available" | "active" | "history" | "all";

export interface DeliveryListParams {
  status?: DeliveryStatus;
  scope?: CourierDeliveryScope;
  customer_id?: string;
  courier_id?: string;
  merchant_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDeliveryPayload {
  customer_id?: string;
  merchant_id?: string;
  category: DeliveryCategory;
  pickup_address: string;
  pickup_contact: string;
  pickup_phone: string;
  pickup_notes?: string;
  dropoff_address: string;
  dropoff_contact: string;
  dropoff_phone: string;
  dropoff_notes?: string;
  item_name: string;
  item_value: number;
  package_size: PackageSize;
  fragile: boolean;
  delivery_notes?: string;
  courier_type: CourierType;
  price: number;
  courier_payout?: number;
  protection: boolean;
  distance_km: number;
}

export interface AssignCourierPayload {
  courier_id: string;
}

export interface UpdateDeliveryStatusPayload {
  status: DeliveryStatus;
  courier_id?: string;
  /**
   * Confirmation PIN read aloud by the sender (pickup) or receiver (drop-off).
   * Verified server-side. The courier never receives the expected value.
   */
  pin?: string;
}

export const deliveryStatuses: DeliveryStatus[] = [
  "pending",
  "searching",
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
];
