import type {
	ProductKey,
	SubscriptionInterval,
	SubscriptionTier,
} from "./constants";

/**
 * User subscription status returned by queries
 */
export interface UserSubscriptionStatus {
	/** The user's current subscription tier */
	tier: SubscriptionTier;
	/** Whether the user has an active pro subscription */
	isPro: boolean;
	/** Whether the user is on the free tier */
	isFree: boolean;
	/** The product key if subscribed (e.g., "proMonthly", "proYearly") */
	productKey: ProductKey | null;
	/** The subscription interval if subscribed */
	interval: SubscriptionInterval | null;
	/** When the current billing period ends (ISO string) */
	currentPeriodEnd: string | null;
	/** Whether the subscription is set to cancel at period end */
	cancelAtPeriodEnd: boolean;
	/** The subscription status from Polar */
	status: string | null;
}

/**
 * Product information for display
 */
export interface ProductInfo {
	id: string;
	name: string;
	priceAmount: number;
	priceCurrency: string;
	interval: SubscriptionInterval;
}
