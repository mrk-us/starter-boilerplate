import { ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthId } from "../auth/helpers";
import { AuthErrorCode, ErrorMessage } from "../errors/constants";

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
				code: AuthErrorCode.NOT_AUTHENTICATED,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		return await ctx.storage.generateUploadUrl();
	},
});
