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
const prohibitedItemPattern = /\b(?:illegal\s+drugs?|firearms?|guns?|ammunition|explosives?|bombs?|stolen\s+goods?|counterfeit\s+goods?|hazardous\s+chemicals?)\b/i;

export const createDeliverySchema = z.object({
  customer_id: z.string().trim().min(3).max(120).optional(),
  merchant_id: z.string().trim().min(3).max(120).optional(),
  category: z.enum(DELIVERY_CATEGORIES).default("general"),
  pickup_area: z.string().trim().min(2).max(120),
  pickup_landmark: z.string().trim().min(2).max(240),
  pickup_address: z.string().trim().max(500).optional(),
  pickup_latitude: z.coerce.number().min(-90).max(90),
  pickup_longitude: z.coerce.number().min(-180).max(180),
  pickup_contact: z.string().trim().min(2).max(120),
  pickup_phone: z.string().trim().min(7).max(40),
  pickup_notes: z.string().trim().max(1000).optional(),
  dropoff_area: z.string().trim().min(2).max(120),
  dropoff_landmark: z.string().trim().min(2).max(240),
  dropoff_address: z.string().trim().max(500).optional(),
  dropoff_latitude: z.coerce.number().min(-90).max(90),
  dropoff_longitude: z.coerce.number().min(-180).max(180),
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
}).superRefine((input, context) => {
  const description = [input.item_name, input.delivery_notes ?? ""]
    .join(" ")
    .trim();
  if (prohibitedItemPattern.test(description)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["item_name"],
      message: "This item appears to be prohibited under MoveDek's delivery policy.",
    });
  }
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(DELIVERY_STATUSES),
});

export const riskLevelSchema = z.enum(DELIVERY_RISK_LEVELS);

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<
  typeof updateDeliveryStatusSchema
>;
