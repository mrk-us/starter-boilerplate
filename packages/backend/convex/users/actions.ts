import { tryCatch } from "@repo/shared";
import { ConvexError } from "convex/values";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";
import { authKit } from "../auth";
import {
	AuthErrorCode,
	ErrorMessage,
	UserErrorCode,
	WorkOSErrorCode,
} from "../errors/constants";
import { rateLimiter } from "../rateLimiter";

/**
 * Delete user account (cancels subscription, deletes from WorkOS and db)
 */
export const deleteUser = action({
	args: {},
	handler: async (ctx) => {
		const authUser = await authKit.getAuthUser(ctx);

		if (!authUser) {
			throw new ConvexError({
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Rate limit
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "deleteUser", {
			key: authUser.id,
		});

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 3_600_000)} hours.`,
			});
		}

		// Cancel subscription (non-critical - user may not have one)
		const { error: cancelSubscriptionError } = await tryCatch(
			ctx.runAction(api.billing.actions.cancelCurrentSubscription, {
				revokeImmediately: true,
			}),
		);

		if (cancelSubscriptionError) {
			console.warn(
				"Failed to cancel subscription during account deletion:",
				cancelSubscriptionError.message,
			);
		}

		// Delete from WorkOS
		const { error: deleteWorkosUserError } = await tryCatch(
			authKit.workos.userManagement.deleteUser(authUser.id),
		);

		if (deleteWorkosUserError) {
			console.error(
				"Failed to delete user from WorkOS:",
				deleteWorkosUserError.message,
			);
			throw new ConvexError({
				code: WorkOSErrorCode.DELETE_USER_FAILED,
				message: ErrorMessage.UNKNOWN,
			});
		}

		// Delete from local db (don't wait for webhook)
		const { error: deleteDbUserError } = await tryCatch(
			ctx.runMutation(internal.users.mutations.deleteUserByAuthId, {
				authId: authUser.id,
			}),
		);

		if (deleteDbUserError) {
			console.error(
				"Failed to delete user from db:",
				deleteDbUserError.message,
			);
			throw new ConvexError({
				code: UserErrorCode.USER_DELETE_FAILED,
				message: ErrorMessage.UNKNOWN,
			});
		}

		return { success: true };
	},
});
