import { z } from "zod";
import { USER_ROLES } from "../constants/roles";

export const emailSchema = z.string().trim().toLowerCase().email();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  email: emailSchema,
  phone: z.string().trim().min(7, "Phone number is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(USER_ROLES).default("customer"),
  business_name: z.string().trim().optional(),
  business_type: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
