import { tryCatch } from "@repo/shared";
import { ConvexError } from "convex/values";
import { components, internal } from "../_generated/api";
import { ERROR_CODE } from "../errors/constants";
import { authKit } from "./index";

/**
 * WorkOS webhook event handlers
 * These are backup/sync handlers - primary user creation happens in auth callback
 */
export const { authKitEvent } = authKit.events({
	/**
	 * User created - backup sync to local db
	 * User should already exist from auth callback, but create if not (idempotent)
	 */
	"user.created": async (ctx, event) => {
		const existingUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();

		// User already exists (created by callback) - nothing to do
		if (existingUser) {
			return;
		}

		// Create user if callback didn't
		await ctx.db.insert("users", {
			authId: event.data.id,
			email: event.data.email,
			name: event.data.firstName ?? "",
			profilePictureUrl: event.data.profilePictureUrl ?? "",
			setupComplete: false,
		});
	},

	/**
	 * User updated - sync changes to local db
	 * Creates user if not exists (handles edge cases)
	 */
	"user.updated": async (ctx, event) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();

		// User doesn't exist - create them (shouldn't ever run, but just in case)
		if (!user) {
			await ctx.db.insert("users", {
				authId: event.data.id,
				email: event.data.email,
				name: event.data.firstName ?? "",
				profilePictureUrl: event.data.profilePictureUrl ?? "",
				setupComplete: false,
			});
			return;
		}

		// Trigger re-verification if email changed
		if (event.data.email !== user.email) {
			await ctx.scheduler.runAfter(
				0,
				internal.auth.actions.resendVerificationEmailOnEmailChange,
				{ authId: event.data.id },
			);
		}

		// Update user data (don't overwrite custom profile picture)
		await ctx.db.patch(user._id, {
			email: event.data.email,
			...(!user.profilePictureStorageId &&
				"profilePictureUrl" in event.data && {
					profilePictureUrl: event.data.profilePictureUrl ?? "",
				}),
		});
	},

	/**
	 * User deleted - remove from local db
	 */
	"user.deleted": async (ctx, event) => {
		if (!event) {
			console.error("No event data for user.deleted webhook");
			throw new ConvexError({
				code: ERROR_CODE.UNKNOWN,
				message: "Invalid webhook event",
			});
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();

		// User may already be deleted or never synced
		if (!user) {
			console.warn("User not found for deletion:", event.data.id);
			return;
		}

		await ctx.db.delete(user._id);
	},

	/**
	 * Session created - sync profile picture from OAuth provider
	 */
	"session.created": async (ctx, event) => {
		if (!event?.data?.userId) {
			return;
		}

		// Fetch WorkOS user data
		const { data: workosUserData, error: workosUserError } = await tryCatch(
			ctx.runQuery(components.workOSAuthKit.lib.getAuthUser, {
				id: event.data.userId,
			}),
		);

		// Non-critical - don't fail session creation
		if (workosUserError) {
			console.warn(
				"Failed to fetch WorkOS user for profile sync:",
				workosUserError.message,
			);
			return;
		}

		if (!workosUserData) {
			return;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", workosUserData.id))
			.unique();

		// Update profile picture if user has no custom picture and it changed
		if (
			user &&
			!user.profilePictureStorageId &&
			workosUserData.profilePictureUrl !== undefined &&
			user.profilePictureUrl !== workosUserData.profilePictureUrl
		) {
			await ctx.db.patch(user._id, {
				profilePictureUrl: workosUserData.profilePictureUrl ?? undefined,
			});
		}
	},

	/**
	 * Invitation created (placeholder for future implementation)
	 */
	"invitation.created": async (_ctx, _event) => {
		// TODO: Implement invitation email
	},

	/**
	 * Password reset requested - send reset email
	 */
	"password_reset.created": async (ctx, event) => {
		if (!event) {
			console.warn("No event data for password_reset.created webhook");
			return;
		}

		await ctx.scheduler.runAfter(
			0,
			internal.emails.actions.sendPasswordResetEmail,
			{ passwordResetId: event.data.id },
		);
	},

	/**
	 * Email verification requested - send verification email
	 */
	"email_verification.created": async (ctx, event) => {
		if (!event) {
			console.warn("No event data for email_verification.created webhook");
			return;
		}

		await ctx.scheduler.runAfter(
			0,
			internal.emails.actions.sendEmailVerificationEmail,
			{ emailVerificationId: event.data.id },
		);
	},
});
