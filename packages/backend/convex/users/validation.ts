import { z } from "zod";
import { authSchema, createPasswordSchema } from "../auth/validation";
import { PROFILE_PICTURE_VALIDATION } from "./constants";

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
  profilePictureKey: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});

/**
 * Update user name schema
 */
export const updateUserNameSchema = z.object({
  name: userSchema.shape.name,
});

/**
 * Change email schema
 */
export const changeEmailSchema = z.object({
  email: authSchema.shape.email,
});

/**
 * Update password schema
 */
export const updatePasswordSchema = z.object({
  authId: userSchema.shape.authId,
  password: createPasswordSchema.shape.password,
});

/**
 * Profile picture schema
 */
export const profilePictureUploadSchema = z.object({
  size: z
    .number()
    .max(
      PROFILE_PICTURE_VALIDATION.maxSizeBytes,
      `File size must be less than ${PROFILE_PICTURE_VALIDATION.maxSizeMB}MB.`
    ),
  type: z.enum(PROFILE_PICTURE_VALIDATION.allowedTypes, {
    error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
  }),
});
