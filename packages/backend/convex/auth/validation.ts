import { z } from "zod";

export const authSchema = z.object({
	authId: z.string("authId is required"),
	email: z.email("Must be a valid email address"),
	verificationCode: z.string().length(6, "Code must be 6 digits"),
	token: z.string().min(1, "Token is required"),
});

export const createPasswordSchema = z.object({
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const usePasswordSchema = z.object({
	password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
	email: authSchema.shape.email,
	password: createPasswordSchema.shape.password,
});

export const verifyEmailSchema = z.object({
	authId: authSchema.shape.authId,
	code: authSchema.shape.verificationCode,
});

export const signInSchema = z.object({
	email: authSchema.shape.email,
	password: usePasswordSchema.shape.password,
});

export const forgotPasswordSchema = z.object({
	email: authSchema.shape.email,
});

export const resetPasswordSchema = z.object({
	token: authSchema.shape.token,
	password: createPasswordSchema.shape.password,
});
