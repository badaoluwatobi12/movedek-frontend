import { getStoredToken } from "@/lib/authStorage";
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

const token = () => getStoredToken();

export const profileService = {
  get: () => http<User>("/users/me", { token: token() }),
  update: (payload: Partial<ProfileUpdate>) =>
    http<User>("/users/me", {
      method: "PATCH",
      token: token(),
      body: JSON.stringify(payload),
    }),
  changePassword: (current_password: string, new_password: string) =>
    http<{ changed: boolean }>("/users/me/password", {
      method: "POST",
      token: token(),
      body: JSON.stringify({ current_password, new_password }),
    }),
};
