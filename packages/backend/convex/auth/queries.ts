import { query } from "../_generated/server";
import { r2 } from "../r2";
import { authKit } from "./index";

// Get the current user from your users table
export const getCurrentUser = query({
	args: {},
	handler: async (ctx, _args) => {
		const authUser = await authKit.getAuthUser(ctx);
		if (!authUser) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			return null;
		}

		// Generate a presigned URL for the profile picture if it exists
		let profilePictureUrl: string | null = null;
		if (user.profilePictureKey) {
			profilePictureUrl = await r2.getUrl(user.profilePictureKey);
		}

		return {
			...user,
			profilePictureUrl,
		};
	},
});
