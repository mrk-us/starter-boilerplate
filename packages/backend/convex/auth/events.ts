import { verifyWebhook } from "@clerk/backend/webhooks";
import { tryCatch } from "@repo/shared";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { ERROR_CODE, USER_ERROR_CODE } from "../errors/constants";
import { getFullName, getPrimaryEmail } from "./helpers";

/**
 * HTTP handler for Clerk webhook events
 */
export async function handleClerkEventWebhook(
	ctx: ActionCtx,
	request: Request,
): Promise<Response> {
	/**
	 * Verify the webhook
	 *
	 * @see https://clerk.com/docs/reference/backend/verify-webhook
	 *
	 * */
	const { data: event, error } = await tryCatch(
		verifyWebhook(request, {
			signingSecret: process.env.CLERK_WEBHOOK_SECRET,
		}),
	);

	// If the webhook verification fails, return error
	if (error) {
		console.error("[verifyWebhook] Webhook verification failed:", error);
		return new Response("Webhook verification failed", { status: 400 });
	}

	/**
	 * Handle the events
	 *
	 * @see https://clerk.com/docs/guides/development/webhooks/overview
	 *
	 * */
	switch (event.type) {
		/**
		 * User created
		 * */
		case "user.created": {
			// Check if user already exists (may have already been created by backend)
			const existingUser = await ctx.runQuery(
				internal.users.queries.getUserByAuthId,
				{ authId: event.data.id },
			);

			if (existingUser) {
				// User already exists, skip creation (idempotent)
				break;
			}

			// Get the user's primary email
			const email = getPrimaryEmail(event.data);
			// If user signed up without an email, throw an error
			if (!email) {
				throw new ConvexError({
					code: ERROR_CODE.INVALID_INPUT,
					message: "[user.created] Missing primary email",
				});
			}

			// Get the user's full name
			const name = getFullName(event.data);
			// Get the user's account setup status (should be false at this stage)
			const setupComplete = Boolean(event.data.public_metadata?.setupComplete);

			// Run the create user mutation
			await ctx.runMutation(internal.users.mutations.createUser, {
				authId: event.data.id,
				email,
				name,
				profilePictureUrl: event.data.image_url,
				setupComplete: setupComplete,
			});
			break;
		}

		/**
		 * User updated
		 * */
		case "user.updated": {
			// Get the user's primary email
			const email = getPrimaryEmail(event.data);
			// If the user has no email, throw an error
			if (!email) {
				throw new ConvexError({
					code: ERROR_CODE.INVALID_INPUT,
					message: "[user.updated] Missing primary email",
				});
			}

			// Get the user's full name and profile picture URL
			const name = getFullName(event.data);
			const profilePictureUrl = event.data.image_url;

			// Update user in a single mutation (handles change detection internally)
			const result = await ctx.runMutation(
				internal.users.mutations.updateUserFromClerk,
				{
					authId: event.data.id,
					email,
					name,
					profilePictureUrl,
				},
			);

			if (!result.success) {
				throw new ConvexError({
					code: USER_ERROR_CODE.USER_NOT_FOUND,
					message: `[user.updated] User ${event.data.id} not found`,
				});
			}

			break;
		}

		/**
		 * User deleted
		 * */
		case "user.deleted": {
			// If the user's id is not found, treat as a bad payload
			if (!event.data.id) {
				console.error("[user.deleted] Missing event.data.id");
				return new Response("Missing user id", { status: 400 });
			}

			// Delete user and cancel subscription
			// This is idempotent - safe if user was already deleted by deleteUser action
			await ctx.runAction(internal.users.actions.deleteUserWithSubscription, {
				authId: event.data.id,
			});
			break;
		}

		/**
		 * Email created
		 * */
		case "email.created": {
			const emailEvent = event;
			const { slug, to_email_address, data } = emailEvent.data;

			if (!to_email_address) {
				throw new ConvexError({
					code: ERROR_CODE.INVALID_INPUT,
					message: "[email.created] Missing to_email_address",
				});
			}

			switch (slug) {
				// Type: verification_code
				case "verification_code":
					if (data?.otp_code) {
						// Send email verification email
						await ctx.runAction(
							internal.emails.actions.sendEmailVerificationEmail,
							{
								email: to_email_address,
								code: data.otp_code,
							},
						);
					} else {
						console.warn(
							"[email.created] Missing otp_code for verification_code",
						);
					}
					break;

				// Type: reset_password_code
				case "reset_password_code":
					if (data?.otp_code) {
						// Send password reset email
						await ctx.runAction(
							internal.emails.actions.sendPasswordResetEmail,
							{
								email: to_email_address,
								code: data.otp_code,
							},
						);
					} else {
						console.warn(
							"[email.created] Missing otp_code for reset_password_code",
						);
					}
					break;

				// Default
				default:
					break;
			}
			break;
		}

		/**
		 * Default case
		 * */
		default: {
			// Silently ignore other events we don't need to handle for now
			break;
		}
	}

	return new Response("OK", { status: 200 });
}
