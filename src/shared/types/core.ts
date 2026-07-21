import type {
  CourierTrustLevel,
  DeliveryRiskLevel,
  DeliveryStatus,
  UserRole,
} from "../constants/roles.js";

export interface UserDTO {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "active" | "suspended";
  created_at: string;
}

export interface CourierDTO {
  id: string;
  user_id: string;
  courier_type: string;
  vehicle_type: string;
  verification_status: "pending" | "approved" | "rejected";
  trust_level: CourierTrustLevel;
  trust_score: number;
  rating: number;
  is_online: boolean;
  completed: number;
  earnings_today: number;
  created_at: string;
}

export interface DeliveryDTO {
  id: string;
  customer_id: string;
  courier_id?: string | null;
  item_name: string;
  category: string;
  pickup_address: string;
  dropoff_address: string;
  amount: number;
  courier_payout: number;
  distance_km: number;
  risk_level: DeliveryRiskLevel;
  status: DeliveryStatus;
  pickup_pin: string;
  dropoff_pin: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
