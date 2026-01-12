"use node";

import { Polar as PolarSDK } from "@polar-sh/sdk";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * Sync existing Polar customer to local db (Node.js runtime required for Polar SDK).
 *
 * This handles the case where a user deleted their account and signed up again
 * with the same email - the Polar customer still exists but isn't linked to the new user.
 */
export const syncExistingPolarCustomer = internalAction({
	args: {
		userId: v.id("users"),
		email: v.string(),
	},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, { userId, email }) => {
		const polarClient = new PolarSDK({
			accessToken: process.env.POLAR_ORGANIZATION_TOKEN,
			server: process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
		});

		try {
			// Look up customer by email in Polar
			const customers = await polarClient.customers.list({
				email,
			});

			if (customers.result.items.length > 0) {
				// Customer exists in Polar - sync to local db
				const polarCustomer = customers.result.items[0];

				// Insert into local polar component db
				await ctx.runMutation(components.polar.lib.insertCustomer, {
					id: polarCustomer.id,
					userId,
					metadata: { userId },
				});

				console.log(
					`Synced existing Polar customer ${polarCustomer.id} to user ${userId}`,
				);

				return polarCustomer.id;
			}

			return null;
		} catch (error) {
			// Log but don't fail - the original flow might still work
			console.error("Error checking for existing Polar customer:", error);
			return null;
		}
	},
});
