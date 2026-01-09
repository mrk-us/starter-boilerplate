import type {
	ProductKey,
	SubscriptionInterval,
	SubscriptionTier,
} from "./constants";

/**
 * User subscription status returned by queries
 */
export interface UserSubscriptionStatus {
	tier: SubscriptionTier;
	isPro: boolean;
	productKey: ProductKey | null;
	interval: SubscriptionInterval | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
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
