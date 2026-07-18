export const USER_ROLES = ["customer", "courier", "merchant", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const COURIER_TRUST_LEVELS = ["bronze", "silver", "gold", "platinum"] as const;
export type CourierTrustLevel = (typeof COURIER_TRUST_LEVELS)[number];

export const DELIVERY_STATUSES = [
  "pending",
  "searching",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_RISK_LEVELS = ["low", "medium", "high", "very_high"] as const;
export type DeliveryRiskLevel = (typeof DELIVERY_RISK_LEVELS)[number];

export const DELIVERY_CATEGORIES = [
  "food",
  "groceries",
  "pharmacy",
  "parcel",
  "personal_pickup",
  "buy_for_me",
  "business",
] as const;
export type DeliveryCategory = (typeof DELIVERY_CATEGORIES)[number];

export const COURIER_TYPES = ["everyday", "motorcycle", "car", "van", "logistics"] as const;
export type CourierType = (typeof COURIER_TYPES)[number];

export const PACKAGE_SIZES = ["small", "medium", "large", "xl", "bulk"] as const;
export type PackageSize = (typeof PACKAGE_SIZES)[number];
