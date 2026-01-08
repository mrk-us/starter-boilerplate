import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { authKit } from "../auth/index";
import { r2 } from "../r2";

////////////////////////////////////////////////////////////
// Get user by email
////////////////////////////////////////////////////////////
export const getUserByEmail = internalQuery({
	args: {
		email: v.union(v.string(), v.array(v.string()), v.null()),
	},
	handler: async (ctx, args) => {
		if (!args.email) {
			return null;
		}
		const emailToSearch = Array.isArray(args.email)
			? args.email[0]
			: args.email;
		if (!emailToSearch || typeof emailToSearch !== "string") {
			return null;
		}
		return await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", emailToSearch))
			.unique();
	},
});

////////////////////////////////////////////////////////////
// Get user by authId
////////////////////////////////////////////////////////////
export const getUserByAuthId = query({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		if (!args.authId) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (!user) {
			return null;
		}

		// Generate a presigned URL for the profile picture if it exists
		// Priority: custom uploaded picture (R2) > WorkOS profile picture
		let profilePictureUrl: string | undefined;

		if (user.profilePictureKey) {
			profilePictureUrl = await r2.getUrl(user.profilePictureKey);
		} else if (user.profilePictureUrl) {
			profilePictureUrl = user.profilePictureUrl;
		}

		return {
			...user,
			profilePictureUrl,
		};
	},
});

////////////////////////////////////////////////////////////
// Get the current db user
////////////////////////////////////////////////////////////
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
		// Priority: custom uploaded picture (R2) > WorkOS profile picture
		let profilePictureUrl: string | undefined;

		if (user.profilePictureKey) {
			profilePictureUrl = await r2.getUrl(user.profilePictureKey);
		} else if (user.profilePictureUrl) {
			profilePictureUrl = user.profilePictureUrl;
		}

		return {
			...user,
			profilePictureUrl,
		};
	},
});
