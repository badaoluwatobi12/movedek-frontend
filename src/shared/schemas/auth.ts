import { z } from "zod";
import { USER_ROLES } from "../constants/roles.js";

export const emailSchema = z.string().trim().toLowerCase().email();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  email: emailSchema,
  phone: z.string().trim().min(7, "Phone number is required."),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .regex(/[a-z]/, "Add a lowercase letter.")
    .regex(/[A-Z]/, "Add an uppercase letter.")
    .regex(/\d/, "Add a number.")
    .regex(/[^A-Za-z0-9]/, "Add a symbol."),
  role: z.enum(USER_ROLES).default("customer"),
  business_name: z.string().trim().optional(),
  business_type: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
