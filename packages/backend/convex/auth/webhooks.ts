import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { getFullName, getPrimaryEmail } from "./helpers";

import type {
	ClerkEmailEvent,
	ClerkUserEvent,
	ClerkWebhookEvent,
} from "./types";

/**
 * HTTP handler for Clerk webhooks
 */
export const handleClerkWebhook = httpAction(async (ctx, request) => {
	// Get the headers
	const svixId = request.headers.get("svix-id");
	const svixTimestamp = request.headers.get("svix-timestamp");
	const svixSignature = request.headers.get("svix-signature");

	if (!svixId || !svixTimestamp || !svixSignature) {
		return new Response("Missing svix headers", { status: 400 });
	}

	// Get the body
	const payload = await request.text();

	// Verify the webhook in a Node.js action
	const verificationResult = await ctx.runAction(
		internal.auth.actions.verifyClerkWebhook,
		{
			payload,
			svixId,
			svixTimestamp,
			svixSignature,
		},
	);

	if (!verificationResult.valid) {
		return new Response(verificationResult.error ?? "Invalid signature", {
			status: 400,
		});
	}

	const event = verificationResult.data as ClerkWebhookEvent;

	// Handle the event
	switch (event.type) {
		case "user.created": {
			const userEvent = event as ClerkUserEvent;
			const email = getPrimaryEmail(userEvent.data);
			if (!email) {
				console.error("No email found for user:", userEvent.data.id);
				return new Response("No email found", { status: 400 });
			}

			const name = getFullName(userEvent.data);
			const onboardingComplete =
				userEvent.data.public_metadata?.onboardingComplete ?? false;

			await ctx.runMutation(internal.auth.mutations.handleUserCreated, {
				authId: userEvent.data.id,
				email,
				name,
				profilePictureUrl: userEvent.data.image_url,
				setupCompleted: onboardingComplete,
			});
			break;
		}

		case "user.updated": {
			const userEvent = event as ClerkUserEvent;
			const email = getPrimaryEmail(userEvent.data);
			if (!email) {
				console.error("No email found for user:", userEvent.data.id);
				return new Response("No email found", { status: 400 });
			}

			const name = getFullName(userEvent.data);
			const onboardingComplete =
				userEvent.data.public_metadata?.onboardingComplete ?? false;

			await ctx.runMutation(internal.auth.mutations.handleUserUpdated, {
				authId: userEvent.data.id,
				email,
				name,
				profilePictureUrl: userEvent.data.image_url,
				setupCompleted: onboardingComplete,
			});
			break;
		}

		case "user.deleted": {
			const userEvent = event as ClerkUserEvent;
			await ctx.runMutation(internal.auth.mutations.handleUserDeleted, {
				authId: userEvent.data.id,
			});
			break;
		}

		case "email.created": {
			const emailEvent = event as ClerkEmailEvent;
			const { slug, to_email_address, data } = emailEvent.data;

			// Handle different email types
			if (slug === "verification_code" && data.otp_code) {
				await ctx.runAction(
					internal.emails.actions.sendEmailVerificationEmail,
					{
						email: to_email_address,
						code: data.otp_code,
					},
				);
			} else if (slug === "reset_password_code" && data.otp_code) {
				await ctx.runAction(internal.emails.actions.sendPasswordResetEmail, {
					email: to_email_address,
					code: data.otp_code,
				});
			} else {
				console.log("Unhandled email slug:", slug);
			}
			break;
		}

		default: {
			// Silently ignore other events we don't need to handle
			// (e.g., session.created, session.ended, etc.)
		}
	}

	return new Response("OK", { status: 200 });
});
