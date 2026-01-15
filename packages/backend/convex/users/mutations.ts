import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { getAuthenticatedUser } from "../auth/helpers";
import { AuthErrorCode, ErrorMessage } from "../errors/constants";

/**
 * Internal mutation: Update user's name by authId
 * Called by the updateName action after updating Clerk
 */
export const updateNameInternal = internalMutation({
	args: {
		authId: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (!user) {
			console.error("User not found for name update:", args.authId);
			return { success: false };
		}

		await ctx.db.patch(user._id, {
			name: args.name,
		});

		return { success: true };
	},
});

/**
 * Internal mutation: Complete user setup by authId
 * Called by the completeSetup action after updating Clerk
 */
export const completeSetupInternal = internalMutation({
	args: {
		authId: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (!user) {
			console.error("User not found for setup completion:", args.authId);
			return { success: false };
		}

		await ctx.db.patch(user._id, {
			name: args.name,
			setupCompleted: true,
		});

		// Send welcome email
		await ctx.scheduler.runAfter(0, internal.emails.actions.sendWelcomeEmail, {
			email: user.email,
			name: args.name,
		});

		return { success: true };
	},
});

/**
 * Update the current user's profile picture
 */
export const updateProfilePicture = mutation({
	args: {
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		if (!user) {
			throw new ConvexError({
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Delete old profile picture from storage
		if (user.profilePictureStorageId) {
			await tryCatch(ctx.storage.delete(user.profilePictureStorageId));
		}

		await ctx.db.patch(user._id, {
			profilePictureStorageId: args.storageId,
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
		const user = await getAuthenticatedUser(ctx);

		if (!user) {
			throw new ConvexError({
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Delete from Convex storage
		if (user.profilePictureStorageId) {
			await tryCatch(ctx.storage.delete(user.profilePictureStorageId));
		}

		await ctx.db.patch(user._id, {
			profilePictureStorageId: undefined,
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

		// Delete profile picture from storage
		if (user.profilePictureStorageId) {
			await tryCatch(ctx.storage.delete(user.profilePictureStorageId));
		}

		await ctx.db.delete(user._id);

		return { success: true, deleted: true };
	},
});
