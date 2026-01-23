"use node";

import { createClerkClient } from "@clerk/backend";
import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import Stripe from "stripe";
import { components, internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { action, internalAction } from "../_generated/server";
import { getFullName, getPrimaryEmail, requireAuthId } from "../auth/helpers";
import {
	CLERK_ERROR_CODE,
	ERROR_CODE,
	ERROR_MESSAGE,
	USER_ERROR_CODE,
} from "../errors/constants";
import { rateLimiter } from "../rateLimiter";
import { userSchema } from "./validation";

/**
 * Get Clerk client instance
 */
function getClerkClient() {
	const secretKey = process.env.CLERK_SECRET_KEY;

	if (!secretKey) {
		throw new ConvexError({
			code: ERROR_CODE.UNKNOWN,
			message: ERROR_MESSAGE.UNKNOWN,
		});
	}

	return createClerkClient({ secretKey });
}

/**
 * Get Stripe client instance
 */
function getStripeClient() {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		throw new ConvexError({
			code: ERROR_CODE.UNKNOWN,
			message: ERROR_MESSAGE.UNKNOWN,
		});
	}
	return new Stripe(secretKey);
}

/**
 * Ensure user exists in Convex DB, creating from Clerk data if needed.
 * This handles the race condition where user reaches /setup before the webhook arrives.
 */
async function ensureUserExists(ctx: ActionCtx, authId: string): Promise<void> {
	// Check if user already exists
	const existingUser = await ctx.runQuery(
		internal.users.queries.getUserByAuthId,
		{ authId },
	);

	if (existingUser) return; // User exists, nothing to do

	// Fetch user data from Clerk API
	const clerk = getClerkClient();

	// Fetch the user from Clerk API
	const { data: clerkUser, error: fetchError } = await tryCatch(
		clerk.users.getUser(authId),
	);

	// If the user is not found, throw an error
	if (fetchError || !clerkUser) {
		console.error(
			"[ensureUserExists] Failed to fetch user from Clerk:",
			fetchError?.message,
		);
		throw new ConvexError({
			code: CLERK_ERROR_CODE.GET_USER_FAILED,
			message: ERROR_MESSAGE.UNKNOWN,
		});
	}

	// Get primary email from Clerk user data
	const email = getPrimaryEmail(clerkUser);

	// If the user has no primary email, throw an error
	if (!email) {
		throw new ConvexError({
			code: ERROR_CODE.INVALID_INPUT,
			message: "[ensureUserExists] User has no primary email",
		});
	}

	// Create user in Convex DB
	const { error: createError } = await tryCatch(
		ctx.runMutation(internal.users.mutations.createUser, {
			authId: clerkUser.id,
			email,
			name: getFullName(clerkUser),
			profilePictureUrl: clerkUser.imageUrl,
			setupComplete: false,
		}),
	);

	// Handle case where user was created between our check and creation (race condition)
	if (createError) {
		// Check if user now exists (created by webhook in the meantime)
		const userNow = await ctx.runQuery(internal.users.queries.getUserByAuthId, {
			authId,
		});

		if (userNow) {
			// User was created by webhook, nothing to do
			return;
		}

		// Log and throw an error
		console.error(
			"[ensureUserExists] Failed to create user:",
			createError.message,
		);
		throw new ConvexError({
			code: USER_ERROR_CODE.USER_CREATE_FAILED,
			message: ERROR_MESSAGE.UNKNOWN,
		});
	}
}

/**
 * Public action to ensure current authenticated user exists in Convex DB.
 * Called on setup page load to handle webhook race condition.
 */
export const ensureCurrentUserExists = action({
	args: {},
	returns: v.object({ exists: v.boolean(), created: v.boolean() }),
	handler: async (ctx) => {
		const authId = await requireAuthId(ctx);

		// Check if user already exists
		const existingUser = await ctx.runQuery(
			internal.users.queries.getUserByAuthId,
			{ authId },
		);

		if (existingUser) {
			return { exists: true, created: false };
		}

		// Create user from Clerk data

		await ensureUserExists(ctx, authId);
		return { exists: true, created: true };
	},
});

/**
 * Update user's name (updates both Clerk and Convex DB)
 */
export const updateName = action({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const authId = await requireAuthId(ctx);

		// Validate input
		const validationResult = userSchema.pick({ name: true }).safeParse({
			name: args.name.trim(),
		});

		if (!validationResult.success) {
			throw new ConvexError({
				code: ERROR_CODE.INVALID_INPUT,
				message: validationResult.error.issues[0]?.message ?? "Invalid name",
			});
		}

		const name = validationResult.data.name;

		// Update Clerk user
		const clerk = getClerkClient();
		const { error: clerkError } = await tryCatch(
			clerk.users.updateUser(authId, {
				firstName: name,
				lastName: "",
			}),
		);

		if (clerkError) {
			console.error("Failed to update Clerk user:", clerkError.message);
			throw new ConvexError({
				code: CLERK_ERROR_CODE.UPDATE_USER_FAILED,
				message: ERROR_MESSAGE.UNKNOWN,
			});
		}

		// Update Convex DB
		await ctx.runMutation(internal.users.mutations.updateUserName, {
			authId,
			name,
		});

		return { success: true };
	},
});

/**
 * Complete user setup (updates Clerk with name + setupComplete, and Convex DB)
 */
export const completeSetup = action({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const authId = await requireAuthId(ctx);

		// Ensure user exists in Convex DB
		await ensureUserExists(ctx, authId);

		// Validate input
		const validationResult = userSchema.pick({ name: true }).safeParse({
			name: args.name.trim(),
		});

		if (!validationResult.success) {
			throw new ConvexError({
				code: ERROR_CODE.INVALID_INPUT,
				message: validationResult.error.issues[0]?.message ?? "Invalid name",
			});
		}

		const name = validationResult.data.name;

		// Update Clerk user with name and setupComplete
		const clerk = getClerkClient();
		const { error: clerkError } = await tryCatch(
			clerk.users.updateUser(authId, {
				firstName: name,
				lastName: "",
				publicMetadata: {
					setupComplete: true,
				},
			}),
		);

		if (clerkError) {
			console.error("Failed to update Clerk user:", clerkError.message);
			throw new ConvexError({
				code: CLERK_ERROR_CODE.UPDATE_USER_FAILED,
				message: ERROR_MESSAGE.UNKNOWN,
			});
		}

		// Update Convex DB and send welcome email
		await ctx.runMutation(internal.users.mutations.completeSetupInternal, {
			authId,
			name,
		});

		return { success: true };
	},
});

/**
 * Public action: Delete user account (cancels subscription, deletes from Clerk and db)
 * Flattened to avoid action-from-action chains for better error handling and performance.
 */
export const deleteUser = action({
	args: {},
	handler: async (ctx) => {
		const authId = await requireAuthId(ctx);

		// Rate limit
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "deleteUser", {
			key: authId,
		});

		if (!ok) {
			throw new ConvexError({
				code: ERROR_CODE.RATE_LIMITED,
				message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 3_600_000)} hours.`,
			});
		}

		// Get user to find their userId for subscription cancellation
		const user = await ctx.runQuery(internal.users.queries.getUserByAuthId, {
			authId,
		});

		// User may already be deleted - continue with Clerk deletion anyway
		if (user) {
			// Cancel subscription if user has one (non-blocking - don't fail if this fails)
			const subscriptions = await ctx.runQuery(
				components.stripe.public.listSubscriptionsByUserId,
				{ userId: user._id },
			);

			const activeSubscription = subscriptions.find(
				(sub: { status: string }) =>
					sub.status === "active" || sub.status === "trialing",
			);

			if (activeSubscription) {
				const stripeClient = getStripeClient();
				const { error: cancelError } = await tryCatch(
					stripeClient.subscriptions.cancel(
						activeSubscription.stripeSubscriptionId,
					),
				);
				if (cancelError) {
					console.warn(
						"[deleteUser] Failed to cancel subscription:",
						cancelError.message,
					);
				}
			}
		}

		// Delete from Clerk (this will trigger the webhook)
		const clerk = getClerkClient();
		const { error: deleteClerkUserError } = await tryCatch(
			clerk.users.deleteUser(authId),
		);

		if (deleteClerkUserError) {
			console.error(
				"[deleteUser] Failed to delete user from Clerk:",
				deleteClerkUserError.message,
			);
			throw new ConvexError({
				code: CLERK_ERROR_CODE.DELETE_USER_FAILED,
				message: ERROR_MESSAGE.UNKNOWN,
			});
		}

		// Delete from DB (don't wait for webhook - handle it ourselves)
		if (user) {
			const { error: deleteDbUserError } = await tryCatch(
				ctx.runMutation(internal.users.mutations.deleteUser, { authId }),
			);

			if (deleteDbUserError) {
				console.error(
					"[deleteUser] Failed to delete user from db:",
					deleteDbUserError.message,
				);
				// Don't throw - Clerk deletion succeeded, DB will be cleaned up by webhook
			}
		}

		return { success: true };
	},
});

/**
 * Internal action: Delete user and cancel subscription
 * Called by webhook handler when user is deleted from Clerk
 */
export const deleteUserWithSubscription = internalAction({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		// Get user to find their userId for subscription cancellation
		const user = await ctx.runQuery(internal.users.queries.getUserByAuthId, {
			authId: args.authId,
		});

		// User already deleted - idempotency
		if (!user) {
			console.warn("[deleteUserInternal] User already deleted:", args.authId);
			return { success: true };
		}

		// Cancel subscription if user has one (inline, no nested action call)
		const subscriptions = await ctx.runQuery(
			components.stripe.public.listSubscriptionsByUserId,
			{ userId: user._id },
		);

		const activeSubscription = subscriptions.find(
			(sub: { status: string }) =>
				sub.status === "active" || sub.status === "trialing",
		);

		if (activeSubscription) {
			const stripeClient = getStripeClient();
			const { error: cancelError } = await tryCatch(
				stripeClient.subscriptions.cancel(
					activeSubscription.stripeSubscriptionId,
				),
			);
			if (cancelError) {
				console.warn(
					"[deleteUserInternal] Failed to cancel subscription:",
					cancelError.message,
				);
			}
		}

		// Delete from DB
		const { error: deleteDbUserError } = await tryCatch(
			ctx.runMutation(internal.users.mutations.deleteUser, {
				authId: args.authId,
			}),
		);

		if (deleteDbUserError) {
			console.error(
				"[deleteUserInternal] Failed to delete user from db:",
				deleteDbUserError.message,
			);
			throw new ConvexError({
				code: USER_ERROR_CODE.USER_DELETE_FAILED,
				message: ERROR_MESSAGE.UNKNOWN,
			});
		}

		return { success: true };
	},
});
