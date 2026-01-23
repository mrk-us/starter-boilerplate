import { mutation } from "../_generated/server";
import { requireAuthId } from "../auth/helpers";

/**
 * Generate a URL for uploading a file to Convex storage
 * The client uploads directly to this URL, then stores the resulting storageId
 */
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireAuthId(ctx);

		return await ctx.storage.generateUploadUrl();
	},
});
