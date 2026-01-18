import type { SUBSCRIPTION_INTERVAL, SUBSCRIPTION_PLAN } from "./constants";

/**
 * User subscription status returned by queries
 */
export type UserSubscriptionStatus = {
	plan: SUBSCRIPTION_PLAN;
	interval: SUBSCRIPTION_INTERVAL | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
	status: string | null;
};

/**
 * Product information for display
 */
export type ProductInfo = {
	id: string;
	name: string;
	priceAmount: number;
	priceCurrency: string;
	interval: SUBSCRIPTION_INTERVAL;
};
