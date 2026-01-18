import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Internal mutation: Handle user.created event
 */
export const handleUserCreated = internalMutation({
	args: {
		authId: v.string(),
		email: v.string(),
		name: v.string(),
		profilePictureUrl: v.union(v.string(), v.null()),
		setupCompleted: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// TODO: Can we use the getUser here?
		const existingUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (existingUser) return null;

		await ctx.db.insert("users", {
			authId: args.authId,
			email: args.email,
			name: args.name,
			profilePictureUrl: args.profilePictureUrl ?? "",
			setupCompleted: args.setupCompleted,
		});

		return null;
	},
});

/**
 * Internal mutation: Handle user.updated event
 * Syncs name, email, profile picture, and onboarding status from Clerk
 */
export const handleUserUpdated = internalMutation({
	args: {
		authId: v.string(),
		email: v.string(),
		name: v.string(),
		profilePictureUrl: v.union(v.string(), v.null()),
		setupCompleted: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// TODO: Can we use the getUser here?
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (!user) {
			console.error("User not found for update:", args.authId);
			return null;
		}

		// Build update data - sync name, email, and setupCompleted from Clerk
		const updateData: {
			email: string;
			name: string;
			setupCompleted: boolean;
			profilePictureUrl?: string;
		} = {
			email: args.email,
			name: args.name,
			setupCompleted: args.setupCompleted,
		};

		// Only update profile picture if user hasn't uploaded a custom one
		if (!user.profilePictureStorageId && args.profilePictureUrl) {
			updateData.profilePictureUrl = args.profilePictureUrl;
		}

		await ctx.db.patch(user._id, updateData);

		return null;
	},
});

/**
 * Internal mutation: Handle user.deleted event
 */
export const handleUserDeleted = internalMutation({
	args: {
		authId: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// TODO: Can we use the getUser here
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (!user) {
			console.warn("User not found for deletion:", args.authId);
			return null;
		}

		await ctx.db.delete(user._id);

		return null;
	},
});
