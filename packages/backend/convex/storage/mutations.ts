import { ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthId } from "../auth/helpers";
import { AUTH_ERROR_CODE, ERROR_MESSAGE } from "../errors/constants";

/**
 * Generate a URL for uploading a file to Convex storage
 * The client uploads directly to this URL, then stores the resulting storageId
 */
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const authId = await getAuthId(ctx);

		if (!authId) {
			throw new ConvexError({
				code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

		return await ctx.storage.generateUploadUrl();
	},
});
