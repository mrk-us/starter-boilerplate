import { ConvexError } from "convex/values";
import { components, internal } from "../_generated/api";
import { authKit } from "./index";

// WorkOS webhook event handlers
export const { authKitEvent } = authKit.events({
	////////////////////////////////////////////////////////////
	// User created event
	////////////////////////////////////////////////////////////
	"user.created": async (ctx, event) => {
		try {
			// Create user in db
			await ctx.db.insert("users", {
				authId: event.data.id,
				email: event.data.email,
				name: event.data.firstName ?? "",
				profilePictureUrl: event.data.profilePictureUrl ?? "",
				setupCompleted: false,
			});
		} catch (error: unknown) {
			console.error("Failed to create user in db:", error);

			throw new ConvexError({
				code: "USER_CREATE_FAILED",
				message: "Failed to create user in db",
			});
		}
	},

	////////////////////////////////////////////////////////////
	// User updated event
	////////////////////////////////////////////////////////////
	"user.updated": async (ctx, event) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();

		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_FOUND",
				message: `User not found for update: ${event.data.id}`,
			});
		}

		// Verify email if changed
		if (event.data.email !== user.email) {
			await ctx.scheduler.runAfter(
				0,
				internal.auth.actions.resendVerificationEmailOnEmailChange,
				{
					authId: event.data.id,
				},
			);
		}

		// Handle profilePictureUrl - update if present in event (even if null)
		const profilePictureUrl =
			"profilePictureUrl" in event.data
				? (event.data.profilePictureUrl ?? "")
				: "";

		// Build update object - only include profilePictureUrl if it was in the event
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

	////////////////////////////////////////////////////////////
	// User deleted event
	////////////////////////////////////////////////////////////
	"user.deleted": async (ctx, event) => {
		if (!event) {
			throw new Error("No event data found for user.deleted");
		}
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();
		if (!user) {
			console.warn(
				`User not found for deletion (already deleted or never synced) - authId: ${event.data.id}`,
			);
			return;
		}
		await ctx.db.delete(user._id);
	},

	////////////////////////////////////////////////////////////
	// Session event
	////////////////////////////////////////////////////////////
	"session.created": async (ctx, event) => {
		if (!event) {
			console.warn("No event data found for session.created");
		}

		// Sync user profile picture from WorkOS when session is created
		if (event.data.userId) {
			try {
				// Get the user from WorkOS to fetch latest profile picture
				const workosUser = await ctx.runQuery(
					components.workOSAuthKit.lib.getAuthUser,
					{ id: event.data.userId },
				);

				if (!workosUser) {
					console.log("onCreateSession", event);
					return;
				}

				const user = await ctx.db
					.query("users")
					.withIndex("authId", (q) => q.eq("authId", workosUser.id))
					.unique();

				// Only update if user exists, has no custom uploaded picture, and profile picture changed
				if (
					user &&
					!user.profilePictureKey &&
					workosUser.profilePictureUrl !== undefined &&
					user.profilePictureUrl !== workosUser.profilePictureUrl
				) {
					await ctx.db.patch(user._id, {
						profilePictureUrl: workosUser.profilePictureUrl ?? undefined,
					});
				}
			} catch (error) {
				// Log but don't fail - session creation should still succeed
				console.error(
					"Failed to sync profile picture on session creation:",
					error,
				);
			}
		}
	},

	////////////////////////////////////////////////////////////
	// Invitation event
	////////////////////////////////////////////////////////////
	"invitation.created": async (ctx, event) => {
		if (!event) {
			console.warn("No event data found for invitation.created");
		}

		// await ctx.scheduler.runAfter(
		// 	0,
		// 	internal.emails.actions.sendInvitationEmail,
		// 	{
		// 		invitationId: event.data.id,
		// 	},
		// );
	},

	////////////////////////////////////////////////////////////
	// Password reset event
	////////////////////////////////////////////////////////////
	"password_reset.created": async (ctx, event) => {
		if (!event) {
			console.warn("No event data found for password_reset.created");
			return;
		}

		await ctx.scheduler.runAfter(
			0,
			internal.emails.actions.sendPasswordResetEmail,
			{
				passwordResetId: event.data.id,
			},
		);
	},

	////////////////////////////////////////////////////////////
	// Email verification event
	////////////////////////////////////////////////////////////
	"email_verification.created": async (ctx, event) => {
		if (!event) {
			console.warn("No event data found for email_verification.created");
		}

		await ctx.scheduler.runAfter(
			0,
			internal.emails.actions.sendEmailVerificationEmail,
			{ emailVerificationId: event.data.id },
		);
	},
});
