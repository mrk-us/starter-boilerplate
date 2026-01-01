import type { EmailId } from "@convex-dev/resend";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { resend } from "./index";

// Check the status of an email
export const checkEmailStatus = query({
	args: {
		emailId: v.string(),
	},
	handler: async (ctx, args) => {
		return await resend.status(ctx, args.emailId as EmailId);
	},
});
