import { query } from "../_generated/server";
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

		return user;
	},
});
