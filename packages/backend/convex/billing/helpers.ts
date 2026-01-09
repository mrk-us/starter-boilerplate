import type { Id } from "../_generated/dataModel";
import {
	type ProductKey,
	SubscriptionInterval,
	SubscriptionTier,
} from "./constants";
import { polar } from "./index";
import type { UserSubscriptionStatus } from "./types";

/**
 * Get subscription status for a user.
 */
export async function getSubscriptionStatusForUser(
	ctx: Parameters<typeof polar.getCurrentSubscription>[0],
	userId: Id<"users">,
): Promise<UserSubscriptionStatus> {
	const subscription = await polar.getCurrentSubscription(ctx, { userId });

	if (!subscription) {
		return {
			tier: SubscriptionTier.FREE,
			isPro: false,
			productKey: null,
			interval: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			status: null,
		};
	}

	const interval =
		subscription.productKey === "proYearly"
			? SubscriptionInterval.YEAR
			: SubscriptionInterval.MONTH;

	return {
		tier: SubscriptionTier.PRO,
		isPro: true,
		productKey: (subscription.productKey as ProductKey) ?? null,
		interval,
		currentPeriodEnd: subscription.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
		status: subscription.status ?? null,
	};
}
