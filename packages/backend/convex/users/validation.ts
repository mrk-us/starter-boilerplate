import { z } from "zod";

////////////////////////////////////////////////////////////
// Validation schema
////////////////////////////////////////////////////////////
export const userSchema = z.object({
	_id: z.string(),
	authId: z.string(),
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(80, "Name must be less than 80 characters")
		.trim(),
	email: z.email("Must be a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	profilePictureKey: z.string().optional(),
	profilePictureUrl: z.string().optional(),
});
