import { z } from "zod";
import { authSchema } from "../auth/validation";

/**
 * User schema
 */
export const userSchema = z.object({
  _id: z.string(),
  authId: authSchema.shape.authId,
  email: authSchema.shape.email,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be less than 80 characters")
    .trim(),
  profilePictureUrl: z.string().optional(),
});

/**
 * Update user name schema
 */
export const updateUserNameSchema = z.object({
  name: userSchema.shape.name,
});
