import { v } from "convex/values";
import { internal } from "../_generated/api";
import { httpAction, internalMutation } from "../_generated/server";

/**
 * Clerk webhook event types we handle
 */
type ClerkUserEvent = {
	data: {
		id: string;
		email_addresses: Array<{
			id: string;
			email_address: string;
			verification: { status: string } | null;
		}>;
		primary_email_address_id: string | null;
		first_name: string | null;
		last_name: string | null;
		image_url: string | null;
		public_metadata: {
			onboardingComplete?: boolean;
		};
	};
	type: "user.created" | "user.updated" | "user.deleted";
};

/**
 * Clerk email webhook event
 */
type ClerkEmailEvent = {
	data: {
		id: string;
		slug: string;
		to_email_address: string;
		data: {
			otp_code?: string;
			[key: string]: unknown;
		};
	};
	type: "email.created";
};

type ClerkWebhookEvent = ClerkUserEvent | ClerkEmailEvent;

/**
 * Get primary email from Clerk user data
 */
function getPrimaryEmail(data: ClerkUserEvent["data"]): string | null {
	const primaryEmail = data.email_addresses.find(
		(e) => e.id === data.primary_email_address_id,
	);
	return (
		primaryEmail?.email_address ??
		data.email_addresses[0]?.email_address ??
		null
	);
}

/**
 * Get full name from Clerk user data
 * Uses firstName as the single name field (can contain full name)
 */
function getFullName(data: ClerkUserEvent["data"]): string {
	// We store the full name in firstName
	// If lastName exists, concatenate them
	const parts = [data.first_name, data.last_name].filter(Boolean);
	return parts.join(" ").trim();
}

/**
 * HTTP handler for Clerk webhooks
 * Note: We verify the webhook in a Node.js action since svix requires Node.js
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
		internal.auth.webhookVerification.verifyClerkWebhook,
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

	const event = verificationResult.event as ClerkWebhookEvent;

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

			await ctx.runMutation(internal.auth.webhooks.handleUserCreated, {
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

			await ctx.runMutation(internal.auth.webhooks.handleUserUpdated, {
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
			await ctx.runMutation(internal.auth.webhooks.handleUserDeleted, {
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
		// Check if user already exists (prevent duplicates)
		const existingUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (existingUser) {
			console.warn("User already exists:", args.authId);
			return null;
		}

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
