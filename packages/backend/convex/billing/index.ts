import { Polar } from "@convex-dev/polar";
import { components, internal } from "../_generated/api";
import type { DataModel, Id } from "../_generated/dataModel";
import { PRODUCT_KEYS } from "./constants";

/**
 * Polar client configuration
 *
 * Environment variables required:
 * - POLAR_ORGANIZATION_TOKEN: Your Polar organization token
 * - POLAR_WEBHOOK_SECRET: Your Polar webhook secret
 * - POLAR_SERVER: "sandbox" or "production" (optional, defaults to "production")
 * - POLAR_PRODUCT_PRO_MONTHLY: Polar product ID for monthly pro subscription
 * - POLAR_PRODUCT_PRO_YEARLY: Polar product ID for yearly pro subscription
 */
export const polar = new Polar<DataModel>(components.polar, {
	getUserInfo: async (ctx): Promise<{ userId: Id<"users">; email: string }> => {
		const user = await ctx.runQuery(
			internal.users.queries.getCurrentUserForBilling,
		);

		if (!user) {
			throw new Error("User not found - must be authenticated");
		}

		return {
			userId: user._id,
			email: user.email,
		};
	},

	// Map product keys to Polar product IDs
	products: {
		[PRODUCT_KEYS.proMonthly]:
			process.env.POLAR_PRODUCT_PRO_MONTHLY ?? "missing_pro_monthly_id",
		[PRODUCT_KEYS.proYearly]:
			process.env.POLAR_PRODUCT_PRO_YEARLY ?? "missing_pro_yearly_id",
	},
});
