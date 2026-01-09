import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { authKit } from "../auth/index";
import { r2 } from "../r2";
import { userSchema } from "./validation";

/**
 * Update the current user's name
 */
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
		const validationResult = userSchema.pick({ name: true }).safeParse({
			name: args.name.trim(),
		});

		if (!validationResult.success || validationResult === undefined) {
			throw new Error(
				validationResult.error.issues[0]?.message ?? "Invalid name format",
			);
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		await ctx.db.patch(user._id, {
			name: validationResult.data.name,
		});

		return { success: true };
	},
});

/**
 * Complete user setup
 */
export const completeSetup = mutation({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const authUser = await authKit.getAuthUser(ctx);

		if (!authUser) {
			throw new Error("Not authenticated");
		}

		// Validate and sanitize input
		const validationResult = userSchema.pick({ name: true }).safeParse({
			name: args.name.trim(),
		});

		if (!validationResult.success || validationResult === undefined) {
			throw new Error(
				validationResult.error.issues[0]?.message ?? "Invalid name format",
			);
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		await ctx.db.patch(user._id, {
			name: validationResult.data.name,
			setupCompleted: true,
		});

		return { success: true };
	},
});

/**
 * Update the current user's profile picture
 */
export const updateProfilePicture = mutation({
	args: {
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const authUser = await authKit.getAuthUser(ctx);
		if (!authUser) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		// Delete old profile picture from R2 if exists
		if (user.profilePictureKey) {
			try {
				await r2.deleteObject(ctx, user.profilePictureKey);
			} catch {
				// Ignore errors when deleting old file
			}
		}

		// Store the R2 key (URL is generated on-the-fly in queries)
		await ctx.db.patch(user._id, {
			profilePictureKey: args.key,
		});

		return { success: true };
	},
});

/**
 * Remove the current user's profile picture
 */
export const removeProfilePicture = mutation({
	args: {},
	handler: async (ctx) => {
		const authUser = await authKit.getAuthUser(ctx);
		if (!authUser) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		// Delete the file from R2
		if (user.profilePictureKey) {
			try {
				await r2.deleteObject(ctx, user.profilePictureKey);
			} catch {
				// Ignore errors when deleting file
			}
		}

		await ctx.db.patch(user._id, {
			profilePictureKey: undefined,
		});

		return { success: true };
	},
});

/**
 * Delete the user from db
 */
export const deleteUserByAuthId = internalMutation({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (!user) {
			return { success: true, deleted: false };
		}

		await ctx.db.delete(user._id);

		return { success: true, deleted: true };
	},
});
