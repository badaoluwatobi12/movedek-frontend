export type Role = "customer" | "courier" | "merchant" | "admin";

export type DeliveryCategory = "general";

export type CourierType =
  "everyday" | "motorcycle" | "car" | "van" | "logistics";

export type TrustLevel = "bronze" | "silver" | "gold" | "platinum";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

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

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  avatar_url?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: "en" | "fr" | "pt";
  notification_preferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    delivery_updates?: boolean;
    promotions?: boolean;
  };
  status: "active" | "suspended";
  pilot_access?: boolean;
  internal_tester?: boolean;
  pilot_access_granted_at?: string;
  pilot_access_granted_by?: string;
  pilot_access_revoked_at?: string;
  pilot_access_revoked_by?: string;
  created_at: string;
}

export interface Courier {
  id: string;
  user_id: string;
  courier_type: CourierType;
  vehicle_type: string;
  verification_status: VerificationStatus;
  trust_level: TrustLevel;
  trust_score: number;
  rating: number;
  is_online: boolean;
  bank_name: string;
  account_number: string;
  completed: number;
  earnings_today: number;
  created_at: string;
  home_address?: string;
  service_zones?: string[];
  plate_number?: string;
  vehicle_colour?: string;
  account_name?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  selfie_uploaded?: boolean;
  id_uploaded?: boolean;
  license_uploaded?: boolean;
  onboarding_submitted_at?: string;
  review?: {
    id: string;
    decision: "approved" | "rejected";
    reason: string;
    reviewed_by: string;
    reviewed_at: string;
    previous_status?: VerificationStatus;
  };
}

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  address: string;
  status: "active" | "pending";
  created_at: string;
}

export interface Delivery {
  id: string;
  customer_id: string;
  courier_id?: string | null;
  merchant_id?: string | null;
  category: DeliveryCategory;
  pickup_address: string;
  pickup_contact: string;
  pickup_phone: string;
  pickup_notes?: string | null;
  dropoff_address: string;
  dropoff_contact: string;
  dropoff_phone: string;
  dropoff_notes?: string | null;
  item_name: string;
  item_value: number;
  package_size: "small" | "medium" | "large" | "xl" | "bulk";
  fragile: boolean;
  delivery_notes?: string | null;
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
  updated_at?: string | null;
  assigned_at?: string | null;
  pickup_confirmed_at?: string | null;
  pickup_proof_uploaded?: boolean;
  transit_started_at?: string | null;
  delivery_confirmed_at?: string | null;
  delivery_proof_uploaded?: boolean;
  completed_at?: string | null;
}

export interface Payment {
  id: string;
  delivery_id: string;
  customer_id: string;
  amount: number;
  status: "paid" | "pending" | "refunded" | "failed";
  escrow_status?: "not_started" | "held" | "released" | "refunded";
  provider: string;
  reference: string;
  authorization_url?: string | null;
  access_code?: string | null;
  paid_at?: string | null;
  escrow_held_at?: string | null;
  escrow_released_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency?: "NGN";
  created_at: string;
  updated_at?: string;
}
export interface WalletTx {
  id: string;
  wallet_id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  status: "success" | "pending" | "failed";
  balance_before?: number;
  balance_after?: number;
  delivery_id?: string | null;
  payment_id?: string | null;
  created_at: string;
}
export interface Withdrawal {
  id: string;
  courier_id: string;
  amount: number;
  status: "pending" | "approved" | "failed" | "paid";
  created_at: string;
}
export interface Rating {
  id: string;
  delivery_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}
export interface Dispute {
  id: string;
  delivery_id: string;
  user_id: string;
  reason: string;
  status: "open" | "reviewing" | "resolved" | "rejected";
  created_at: string;
}
export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "pending" | "closed";
  created_at: string;
}
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export type VerificationDocumentType =
  "selfie" | "government_id" | "driver_license";

export type VerificationDocumentStatus = "uploaded" | "approved" | "rejected";

export interface VerificationDocument {
  id: string;
  courierId: string;
  ownerUserId: string;
  documentType: VerificationDocumentType;
  provider: "r2" | "cloudinary";
  resourceType: "image" | "raw";
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  originalName: string;
  mimeType: string;
  status: VerificationDocumentStatus;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  accessUrl: string;
  downloadUrl: string;
}
