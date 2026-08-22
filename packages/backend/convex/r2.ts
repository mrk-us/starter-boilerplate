import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { ERROR_MESSAGE } from "./errors/constants";

export const r2 = new R2(components.r2);

/**
 * Client API for uploading files to R2
 * Use with useUploadFile hook from @convex-dev/r2/react
 */
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
	checkUpload: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error(ERROR_MESSAGE.NOT_AUTHENTICATED);
	},
});

/**
 * Get a presigned URL for an R2 object
 */
export const getUrl = query({
	args: { key: v.string() },
	handler: async (_ctx, args) => {
		return await r2.getUrl(args.key);
	},
});
