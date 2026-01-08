import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { authKit } from "./auth/index";

export const r2 = new R2(components.r2);

////////////////////////////////////////////////////////////
// Client API for uploading files to R2
////////////////////////////////////////////////////////////
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
	// Validate that the user can upload
	checkUpload: async (ctx) => {
		const authUser = await authKit.getAuthUser(ctx);
		if (!authUser) {
			throw new Error("Not authenticated");
		}
	},
	// Called after upload is complete and metadata is synced
	onUpload: async (ctx, _bucket, key) => {
		console.log("File uploaded with key:", key);
	},
});
