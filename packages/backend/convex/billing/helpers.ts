import { createSha256Hash } from "@repo/shared";
import type { GenericQueryCtx } from "convex/server";
import { components } from "../_generated/api";
import type { DataModel, Id } from "../_generated/dataModel";
import {
	STRIPE_PRICE_LOOKUP_KEY,
	SUBSCRIPTION_INTERVAL,
	SUBSCRIPTION_PLAN,
} from "./constants";
import type { SubscriptionInterval, UserSubscription } from "./types";

/**
 * Get subscription status for a user by querying the Stripe component's subscriptions table.
 */
export async function getSubscriptionStatusForUser(
	ctx: GenericQueryCtx<DataModel>,
	userId: Id<"users">,
): Promise<UserSubscription> {
	// Query the Stripe component's subscriptions by userId
	const subscriptions = await ctx.runQuery(
		components.stripe.public.listSubscriptionsByUserId,
		{ userId },
	);

	// Find active subscription
	const activeSubscription = subscriptions.find(
		(sub) => sub.status === "active" || sub.status === "trialing",
	);

	if (!activeSubscription) {
		return {
			plan: SUBSCRIPTION_PLAN.FREE,
			interval: null,
			status: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
		};
	}

	// Determine interval and product key from price lookup key in metadata
	// or fall back to price interval from the subscription
	const priceLookupKey = activeSubscription.metadata?.priceLookupKey as
		| string
		| undefined;

	let interval: SubscriptionInterval;

	if (priceLookupKey === STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY) {
		interval = SUBSCRIPTION_INTERVAL.YEAR;
	} else {
		// Default to monthly
		interval = SUBSCRIPTION_INTERVAL.MONTH;
	}

	// Convert currentPeriodEnd timestamp to ISO string
	const currentPeriodEnd = activeSubscription.currentPeriodEnd
		? new Date(activeSubscription.currentPeriodEnd * 1000).toISOString()
		: null;

	return {
		plan: SUBSCRIPTION_PLAN.PRO,
		interval,
		status: activeSubscription.status,
		currentPeriodEnd,
		cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
	};
}

/**
 * Create a deterministic hash of subscription state.
 * Used to detect if subscription has changed (e.g., webhook updated it).
 */
export async function createSubscriptionHash(
	subscription: UserSubscription,
): Promise<string> {
	const normalized = JSON.stringify({
		plan: subscription.plan,
		status: subscription.status,
		interval: subscription.interval,
		currentPeriodEnd: subscription.currentPeriodEnd,
		cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
	});
	return createSha256Hash(normalized);
}
