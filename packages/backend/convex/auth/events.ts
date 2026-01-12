import { tryCatch } from "@repo/shared";
import { ConvexError } from "convex/values";
import { components, internal } from "../_generated/api";
import { ErrorCode, UserErrorCode } from "../errors/constants";
import { authKit } from "./index";

/**
 * WorkOS webhook event handlers
 */
export const { authKitEvent } = authKit.events({
	/**
	 * User created - sync to local db
	 */
	"user.created": async (ctx, event) => {
		const { error: insertUserError } = await tryCatch(
			ctx.db.insert("users", {
				authId: event.data.id,
				email: event.data.email,
				name: event.data.firstName ?? "",
				profilePictureUrl: event.data.profilePictureUrl ?? "",
				setupCompleted: false,
			}),
		);

		if (insertUserError) {
			console.error("Failed to create user in db:", insertUserError.message);
			throw new ConvexError({
				code: UserErrorCode.USER_CREATE_FAILED,
				message: "Failed to create user",
			});
		}
	},

	/**
	 * User updated - sync changes to local db
	 */
	"user.updated": async (ctx, event) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();

		if (!user) {
			console.error("User not found for update:", event.data.id);
			throw new ConvexError({
				code: UserErrorCode.USER_NOT_FOUND,
				message: "User not found",
			});
		}

		// Trigger re-verification if email changed
		if (event.data.email !== user.email) {
			await ctx.scheduler.runAfter(
				0,
				internal.auth.actions.resendVerificationEmailOnEmailChange,
				{ authId: event.data.id },
			);
		}

		const profilePictureUrl =
			"profilePictureUrl" in event.data
				? (event.data.profilePictureUrl ?? "")
				: "";

		const updateData: {
			email: string;
			profilePictureUrl?: string | "";
		} = {
			email: event.data.email,
		};

		if ("profilePictureUrl" in event.data) {
			updateData.profilePictureUrl = profilePictureUrl;
		}

		await ctx.db.patch(user._id, updateData);
	},

	/**
	 * User deleted - remove from local db
	 */
	"user.deleted": async (ctx, event) => {
		if (!event) {
			console.error("No event data for user.deleted webhook");
			throw new ConvexError({
				code: ErrorCode.UNKNOWN,
				message: "Invalid webhook event",
			});
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();

		// User may already be deleted or never synced - this is acceptable
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

		// Update profile picture if user exists, has no custom picture, and it changed
		if (
			user &&
			!user.profilePictureKey &&
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
