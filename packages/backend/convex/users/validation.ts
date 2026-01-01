import { z } from "zod";

// Validation schema
export const nameSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters").max(80, "Name must be less than 80 characters").trim(),
});
