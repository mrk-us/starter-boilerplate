import type { z } from "zod";
import type { UserSubscription } from "../billing/types";
import type { userSchema } from "./validation";

/**
 * User type inferred from validation schema
 */
export type User = z.infer<typeof userSchema>;

/**
 * User with subscription status (returned by getCurrentUser query)
 */
export type UserWithSubscription = User & {
  profilePictureUrl?: string;
  subscription: UserSubscription;
};
