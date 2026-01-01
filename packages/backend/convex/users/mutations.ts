import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { authKit } from "../auth/index";
import { updateNameSchema } from "./validation";

// Update the current user's name
export const updateName = mutation({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const authUser = await authKit.getAuthUser(ctx);
		if (!authUser) {
			throw new Error("Not authenticated");
		}

		// Validate and sanitize input
		const validationResult = updateNameSchema.safeParse({ name: args.name });
		if (!validationResult.success) {
			throw new Error(validationResult.error.issues[0]?.message ?? "Invalid name format");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		// Use validated and trimmed name
		await ctx.db.patch(user._id, {
			name: validationResult.data.name,
		});

		return { success: true };
	},
});
