import { z } from "zod";

// Client-side validation only. No backend endpoint enforces this shape yet —
// see docs/known backend gaps: POST /api/verification is currently a stub
// with no database table behind it.
export const courierVerificationSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  home_address: z.string().trim().min(3, "Home address is required."),
  service_zones: z
    .string()
    .trim()
    .min(2, "Add at least one preferred work zone."),
  vehicle_type: z.string().trim().min(1, "Select a courier type."),
  vehicle_model: z
    .string()
    .trim()
    .min(1, "Vehicle / movement type is required."),
  plate_number: z.string().trim().optional(),
  vehicle_colour: z.string().trim().optional(),
  bank_name: z.string().trim().min(2, "Bank name is required."),
  account_number: z.string().trim().min(6, "Enter a valid account number."),
  account_name: z.string().trim().min(2, "Account name is required."),
  emergency_contact_name: z
    .string()
    .trim()
    .min(2, "Emergency contact name is required."),
  emergency_contact_relationship: z.string().trim().optional(),
  emergency_contact_phone: z
    .string()
    .trim()
    .min(7, "Emergency contact phone is required."),
  selfie_uploaded: z.boolean(),
  id_uploaded: z.boolean(),
  license_uploaded: z.boolean(),
});

export type CourierVerificationInput = z.infer<
  typeof courierVerificationSchema
>;
