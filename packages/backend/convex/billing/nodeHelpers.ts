"use node";

import { Polar as PolarSDK } from "@polar-sh/sdk";
import { tryCatch } from "@repo/shared";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * Sync existing Polar customer to local db.
 * Handles returning users who deleted their account and signed up again.
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

		// Look up customer by email in Polar
		const { data: customersData, error: listCustomersError } = await tryCatch(
			polarClient.customers.list({ email }),
		);

		// Non-critical - original checkout flow may still work
		if (listCustomersError) {
			console.warn(
				"Failed to check for existing Polar customer:",
				listCustomersError.message,
			);
			return null;
		}

		// No existing customer found
		if (customersData.result.items.length === 0) {
			return null;
		}

		const polarCustomer = customersData.result.items[0];

		// Sync to local db
		const { error: insertCustomerError } = await tryCatch(
			ctx.runMutation(components.polar.lib.insertCustomer, {
				id: polarCustomer.id,
				userId,
				metadata: { userId },
			}),
		);

		if (insertCustomerError) {
			console.warn(
				"Failed to sync Polar customer to db:",
				insertCustomerError.message,
			);
			return null;
		}

		return polarCustomer.id;
	},
});
