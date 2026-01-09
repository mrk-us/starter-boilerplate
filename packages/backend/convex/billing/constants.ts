/**
 * Subscription tier constants
 *
 * Users are on the "free" tier by default (no Polar subscription).
 * Pro tier users have an active Polar subscription.
 */
export const SubscriptionTier = {
	FREE: "free",
	PRO: "pro",
} as const;

export type SubscriptionTier =
	(typeof SubscriptionTier)[keyof typeof SubscriptionTier];

/**
 * Subscription interval constants
 */
export const SubscriptionInterval = {
	MONTH: "month",
	YEAR: "year",
} as const;

export type SubscriptionInterval =
	(typeof SubscriptionInterval)[keyof typeof SubscriptionInterval];

/**
 * Product keys for referencing products in code.
 * These are the keys used in the Polar products map.
 */
export const PRODUCT_KEYS = {
	proMonthly: "proMonthly",
	proYearly: "proYearly",
} as const;

export type ProductKey = keyof typeof PRODUCT_KEYS;

/**
 * Pricing information (in cents for consistency with Polar)
 */
export const Pricing = {
	PRO_MONTHLY: 1200, // $12.00/month
	PRO_YEARLY: 12000, // $120.00/year (equivalent to $10/month)
} as const;
