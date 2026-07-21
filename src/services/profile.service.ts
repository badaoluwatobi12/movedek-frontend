import type { User } from "@/lib/types";
import { http } from "./http";

export type ProfileUpdate = Pick<User, "full_name" | "email" | "phone"> & {
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
};

export const profileService = {
  get: () => http<User>("/users/me"),
  update: (payload: Partial<ProfileUpdate>) =>
    http<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  changePassword: (current_password: string, new_password: string) =>
    http<{ changed: boolean }>("/users/me/password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),
  deleteAccount: (password: string, confirmation: string, reason?: string) =>
    http<{ deleted: boolean }>("/users/me", {
      method: "DELETE",
      body: JSON.stringify({ password, confirmation, reason }),
    }),
};
