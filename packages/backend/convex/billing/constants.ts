/**
 * Subscription tier
 */
export const SubscriptionTier = {
	FREE: "free",
	PRO: "pro",
} as const;

export type SubscriptionTier =
	(typeof SubscriptionTier)[keyof typeof SubscriptionTier];

/**
 * Subscription interval
 */
export const SubscriptionInterval = {
	MONTH: "month",
	YEAR: "year",
} as const;

export type SubscriptionInterval =
	(typeof SubscriptionInterval)[keyof typeof SubscriptionInterval];

/**
 * Product keys
 */
export const PRODUCT_KEYS = {
	proMonthly: "proMonthly",
	proYearly: "proYearly",
} as const;

export type ProductKey = keyof typeof PRODUCT_KEYS;

/**
 * Pricing information (in USD cents)
 */
export const Pricing = {
	PRO_MONTHLY: 1200, // $12.00
	PRO_YEARLY: 12000, // $120.00
} as const;
