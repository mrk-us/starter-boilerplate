import { z } from "zod";

/**
 * Base auth schemas for validation
 */
export const authSchema = z.object({
	authId: z.string("authId is required"),
	email: z.email("Must be a valid email address"),
	verificationCode: z.string().length(6, "Code must be 6 digits"),
});

export const createPasswordSchema = z.object({
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const usePasswordSchema = z.object({
	password: z.string().min(1, "Password is required"),
});

/**
 * Sign up with email and password
 */
export const signUpSchema = z.object({
	email: authSchema.shape.email,
	password: createPasswordSchema.shape.password,
});

/**
 * Verify email with code
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
 * Forgot password - request reset code
 */
export const forgotPasswordSchema = z.object({
	email: authSchema.shape.email,
});

export const resetPasswordSchema = z.object({
	password: createPasswordSchema.shape.password,
});
