import { z } from "zod";
import { authSchema, createPasswordSchema } from "../auth/validation";

export const userSchema = z.object({
	_id: z.string(),
	authId: authSchema.shape.authId,
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(80, "Name must be less than 80 characters")
		.trim(),
	email: authSchema.shape.email,
	profilePictureKey: z.string().optional(),
	profilePictureUrl: z.string().optional(),
});

export const updateUserNameSchema = z.object({
	name: userSchema.shape.name,
});

export const changeEmailSchema = z.object({
	email: authSchema.shape.email,
});

export const updatePasswordSchema = z.object({
	authId: userSchema.shape.authId,
	password: createPasswordSchema.shape.password,
});
