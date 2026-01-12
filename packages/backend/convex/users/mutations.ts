import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { authKit } from "../auth/index";
import {
	AuthErrorCode,
	ErrorCode,
	ErrorMessage,
	UserErrorCode,
} from "../errors/constants";
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
			throw new ConvexError({
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Validate input
		const validationResult = userSchema.pick({ name: true }).safeParse({
			name: args.name.trim(),
		});

		if (!validationResult.success) {
			throw new ConvexError({
				code: ErrorCode.INVALID_INPUT,
				message: validationResult.error.issues[0]?.message ?? "Invalid name",
			});
		}

		// Find user in db
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new ConvexError({
				code: UserErrorCode.USER_NOT_FOUND,
				message: ErrorMessage.USER_NOT_FOUND,
			});
		}

		await ctx.db.patch(user._id, {
			name: validationResult.data.name,
		});

		return { success: true };
	},
});

/**
 * Complete user setup with name
 */
export const completeSetup = mutation({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const authUser = await authKit.getAuthUser(ctx);

		if (!authUser) {
			throw new ConvexError({
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Validate input
		const validationResult = userSchema.pick({ name: true }).safeParse({
			name: args.name.trim(),
		});

		if (!validationResult.success) {
			throw new ConvexError({
				code: ErrorCode.INVALID_INPUT,
				message: validationResult.error.issues[0]?.message ?? "Invalid name",
			});
		}

		// Find user in db
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new ConvexError({
				code: UserErrorCode.USER_NOT_FOUND,
				message: ErrorMessage.USER_NOT_FOUND,
			});
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
			throw new ConvexError({
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Find user in db
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new ConvexError({
				code: UserErrorCode.USER_NOT_FOUND,
				message: ErrorMessage.USER_NOT_FOUND,
			});
		}

		// Delete old profile picture (non-critical)
		if (user.profilePictureKey) {
			await tryCatch(r2.deleteObject(ctx, user.profilePictureKey));
		}

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
			throw new ConvexError({
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Find user in db
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			throw new ConvexError({
				code: UserErrorCode.USER_NOT_FOUND,
				message: ErrorMessage.USER_NOT_FOUND,
			});
		}

		// Delete from R2 (non-critical)
		if (user.profilePictureKey) {
			await tryCatch(r2.deleteObject(ctx, user.profilePictureKey));
		}

		await ctx.db.patch(user._id, {
			profilePictureKey: undefined,
		});

		return { success: true };
	},
});

/**
 * Delete user from db by authId (internal)
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

		// User may already be deleted
		if (!user) {
			return { success: true, deleted: false };
		}

		await ctx.db.delete(user._id);

		return { success: true, deleted: true };
	},
});
