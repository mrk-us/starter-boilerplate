import { internal } from "../_generated/api";
import { authKit } from "./index";

export const { authKitEvent } = authKit.events({
	// User created events
	"user.created": async (ctx, event) => {
		await ctx.db.insert("users", {
			authId: event.data.id,
			email: event.data.email,
			name: `${event.data.firstName ?? ""}${event.data.lastName ? ` ${event.data.lastName}` : ""}`,
			profilePictureUrl: event.data.profilePictureUrl ?? undefined,
		});
	},

	// User updated events
	"user.updated": async (ctx, event) => {
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();
		if (!user) {
			console.warn(`User not found: ${event.data.id}`);
			return;
		}
		await ctx.db.patch(user._id, {
			email: event.data.email,
			name: `${event.data.firstName ?? ""}${event.data.lastName ? ` ${event.data.lastName}` : ""}`,
			profilePictureUrl: event.data.profilePictureUrl ?? undefined,
		});
	},

	// User deleted events
	"user.deleted": async (ctx, event) => {
		if (!event) {
			throw new Error("No event data found for user.deleted");
		}
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", event.data.id))
			.unique();
		if (!user) {
			console.warn(`User not found: ${event.data.id}`);
			return;
		}
		await ctx.db.delete(user._id);
	},

	// Session events
	"session.created": async (_ctx, event) => {
		if (!event) {
			throw new Error("No event data found for session.created");
		}
		await Promise.resolve();
		console.log("onCreateSession", event);
	},

	// Invitation events
	"invitation.created": async (ctx, event) => {
		if (!event) {
			throw new Error("No event data found for invitation.created");
		}
		await ctx.scheduler.runAfter(0, internal.emails.actions.sendInvitationEmail, {
			invitationId: event.data.id,
		});
	},

	// Password reset events
	"password_reset.created": async (ctx, event) => {
		if (!event) {
			throw new Error("No event data found for password_reset.created");
		}
		await ctx.scheduler.runAfter(0, internal.emails.actions.sendPasswordResetEmail, {
			passwordResetId: event.data.id,
		});
	},

	// Magic auth events
	"magic_auth.created": async (ctx, event) => {
		if (!event) {
			throw new Error("No event data found for magic_auth.created");
		}
		await ctx.scheduler.runAfter(0, internal.emails.actions.sendMagicAuthEmail, {
			magicAuthId: event.data.id,
		});
	},

	// Email verification events
	"email_verification.created": async (ctx, event) => {
		if (!event) {
			throw new Error("No event data found for email_verification.created");
		}
		await ctx.scheduler.runAfter(0, internal.emails.actions.sendEmailVerificationEmail, {
			emailVerificationId: event.data.id,
		});
	},
});
