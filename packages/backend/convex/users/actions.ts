import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { authKit } from "../auth";
import { AuthErrorCode } from "../auth/constants";
import { rateLimiter } from "../rateLimiter";

////////////////////////////////////////////////////////////
// Delete user account from WorkOS and db
////////////////////////////////////////////////////////////
export const deleteUser = action({
	args: {},
	handler: async (ctx) => {
		try {
			const authUser = await authKit.getAuthUser(ctx);

			// Check if user is authenticated
			if (!authUser) {
				throw new ConvexError({
					code: AuthErrorCode.UNAUTHORIZED,
					message: "Not authenticated",
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

			// Delete user from WorkOS
			await authKit.workos.userManagement.deleteUser(authUser.id);

			// Delete user from db
			await ctx.runMutation(internal.users.mutations.deleteUserByAuthId, {
				authId: authUser.id,
			});
		} catch (error: unknown) {
			console.error("Failed to delete user:", error);

			throw new ConvexError({
				code: "USER_DELETE_FAILED",
				message: "Failed to delete account. Please try again.",
			});
		}

		return { success: true };
	},
});
