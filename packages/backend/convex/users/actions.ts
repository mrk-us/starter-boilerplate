"use node";

import { createClerkClient } from "@clerk/backend";
import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";
import { getAuthId } from "../auth/helpers";
import {
	AUTH_ERROR_CODE,
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
		throw new Error("CLERK_SECRET_KEY is not configured");
	}
	return createClerkClient({ secretKey });
}

/**
 * Update user's name (updates both Clerk and Convex DB)
 */
export const updateName = action({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const authId = await getAuthId(ctx);

		if (!authId) {
			throw new ConvexError({
				code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

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
				code: CLERK_ERROR_CODE.CREATE_USER_FAILED,
				message: ERROR_MESSAGE.UNKNOWN,
			});
		}

		// Update Convex DB
		await ctx.runMutation(internal.users.mutations.updateNameInternal, {
			authId,
			name,
		});

		return { success: true };
	},
});

/**
 * Complete user setup (updates Clerk with name + onboardingComplete, and Convex DB)
 */
export const completeSetup = action({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const authId = await getAuthId(ctx);

		if (!authId) {
			throw new ConvexError({
				code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

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

		// Update Clerk user with name and onboardingComplete
		const clerk = getClerkClient();
		const { error: clerkError } = await tryCatch(
			clerk.users.updateUser(authId, {
				firstName: name,
				lastName: "",
				publicMetadata: {
					onboardingComplete: true,
				},
			}),
		);

		if (clerkError) {
			console.error("Failed to update Clerk user:", clerkError.message);
			throw new ConvexError({
				code: CLERK_ERROR_CODE.CREATE_USER_FAILED,
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
 * Delete user account (cancels subscription, deletes from Clerk and db)
 */
export const deleteUser = action({
	args: {},
	handler: async (ctx) => {
		const authId = await getAuthId(ctx);

		if (!authId) {
			throw new ConvexError({
				code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

		// Rate limit
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "deleteUser", {
			key: authId,
		});

		if (!ok) {
			throw new ConvexError({
				code: AUTH_ERROR_CODE.RATE_LIMITED,
				message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 3_600_000)} hours.`,
			});
		}

		// Cancel subscription (non-critical - user may not have one)
		const { error: cancelSubscriptionError } = await tryCatch(
			ctx.runAction(api.billing.actions.cancelCurrentSubscription, {
				cancelImmediately: true,
			}),
		);

		if (cancelSubscriptionError) {
			console.warn(
				"Failed to cancel subscription during account deletion:",
				cancelSubscriptionError.message,
			);
		}

		// Delete from Clerk
		const clerk = getClerkClient();
		const { error: deleteClerkUserError } = await tryCatch(
			clerk.users.deleteUser(authId),
		);

		if (deleteClerkUserError) {
			console.error(
				"Failed to delete user from Clerk:",
				deleteClerkUserError.message,
			);
			throw new ConvexError({
				code: CLERK_ERROR_CODE.DELETE_USER_FAILED,
				message: ERROR_MESSAGE.UNKNOWN,
			});
		}

		// Delete from local db (don't wait for webhook)
		const { error: deleteDbUserError } = await tryCatch(
			ctx.runMutation(internal.users.mutations.deleteUserByAuthId, {
				authId,
			}),
		);

		if (deleteDbUserError) {
			console.error(
				"Failed to delete user from db:",
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
