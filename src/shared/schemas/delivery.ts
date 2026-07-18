import { z } from "zod";
import {
  COURIER_TYPES,
  DELIVERY_CATEGORIES,
  DELIVERY_RISK_LEVELS,
  DELIVERY_STATUSES,
  PACKAGE_SIZES,
} from "../constants/roles";

// Mirrors apps/backend/src/modules/deliveries/delivery.validator.ts's
// createDeliverySchema exactly (flat pickup_*/dropoff_* fields) — the actual
// enforced backend contract, not the delivery form's UI grouping.
export const createDeliverySchema = z.object({
  customer_id: z.string().trim().min(3).max(120).optional(),
  merchant_id: z.string().trim().min(3).max(120).optional(),
  category: z.enum(DELIVERY_CATEGORIES).default("parcel"),
  pickup_address: z.string().trim().min(3).max(500),
  pickup_contact: z.string().trim().min(2).max(120),
  pickup_phone: z.string().trim().min(7).max(40),
  pickup_notes: z.string().trim().max(1000).optional(),
  dropoff_address: z.string().trim().min(3).max(500),
  dropoff_contact: z.string().trim().min(2).max(120),
  dropoff_phone: z.string().trim().min(7).max(40),
  dropoff_notes: z.string().trim().max(1000).optional(),
  item_name: z.string().trim().min(2).max(160),
  item_value: z.coerce.number().min(0).max(100_000_000).default(0),
  package_size: z.enum(PACKAGE_SIZES).default("small"),
  fragile: z.coerce.boolean().default(false),
  delivery_notes: z.string().trim().max(1000).optional(),
  courier_type: z.enum(COURIER_TYPES).default("motorcycle"),
  protection: z.coerce.boolean().default(false),
  distance_km: z.coerce.number().min(0.1).max(10_000),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(DELIVERY_STATUSES),
});

export const riskLevelSchema = z.enum(DELIVERY_RISK_LEVELS);

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
