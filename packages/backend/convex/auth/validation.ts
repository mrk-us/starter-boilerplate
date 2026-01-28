import { z } from "zod";

/**
 * Base auth schemas
 */
export const authSchema = z.object({
	authId: z.string("authId is required"),
	email: z.email("Invalid email address").min(1, "Email is required"),
	verificationCode: z.string().length(6, "Code must be 6 digits"),
});

/**
 * Create password schema
 */
export const createPasswordSchema = z.object({
	password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Use password schema
 */
export const usePasswordSchema = z.object({
	password: z.string().min(1, "Password is required"),
});

/**
 * Sign up with email and password schema
 */
export const signUpSchema = z.object({
	email: authSchema.shape.email,
	password: createPasswordSchema.shape.password,
});

/**
 * Verify email schema
 */
export const verifyEmailSchema = z.object({
	code: authSchema.shape.verificationCode,
});

/**
 * Sign in with email and password
 */
export const signInSchema = z.object({
	email: authSchema.shape.email,
	password: usePasswordSchema.shape.password,
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
	email: authSchema.shape.email,
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
	password: createPasswordSchema.shape.password,
	token: z.string().min(1, "Token is required"),
});
