"use node";

import { getErrorMessage, tryCatch } from "@repo/shared";
import { v } from "convex/values";
import { Webhook } from "svix";
import { internalAction } from "../_generated/server";

/**
 * Verify Clerk webhook signature using svix
 */
export const verifyClerkWebhook = internalAction({
	args: {
		payload: v.string(),
		svixId: v.string(),
		svixTimestamp: v.string(),
		svixSignature: v.string(),
	},
	returns: v.object({
		valid: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_ctx, args) => {
		const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

		if (!webhookSecret) {
			console.error("CLERK_WEBHOOK_SECRET is not configured");
			return { valid: false, error: "Webhook secret not configured" };
		}

		const wh = new Webhook(webhookSecret);

		const { data, error } = tryCatch(() =>
			wh.verify(args.payload, {
				"svix-id": args.svixId,
				"svix-timestamp": args.svixTimestamp,
				"svix-signature": args.svixSignature,
			}),
		);

		if (error) {
			console.error("Error verifying webhook:", error);
			return { valid: false, error: getErrorMessage(error) };
		}

		return { valid: true, data };
	},
});
