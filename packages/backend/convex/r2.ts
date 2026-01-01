import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { authKit } from "./auth/index";

export const r2 = new R2(components.r2);

// Export client API for uploading files
// These functions are called from the frontend via useUploadFile hook
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
		// The key is returned to the client after upload
		// The actual profile picture update is handled by a separate mutation
		console.log("File uploaded with key:", key);
	},
});

