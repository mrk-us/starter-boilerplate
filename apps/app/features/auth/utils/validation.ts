import { userSchema } from "@repo/backend/convex/users/validation";
import { z } from "zod";

export const signInSchema = z.object({
	email: userSchema.shape.email,
	password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
	email: userSchema.shape.email,
	password: userSchema.shape.password,
});

export const forgotPasswordSchema = z.object({
	email: userSchema.shape.email,
});

export const resetPasswordSchema = z.object({
	token: z.string().min(1, "Token is required"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyEmailSchema = z.object({
	authId: z.string().min(1, "authId is required"),
	code: z.string().length(6, "Code must be 6 digits"),
});
