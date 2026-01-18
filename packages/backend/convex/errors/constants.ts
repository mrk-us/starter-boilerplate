/**
 * General error codes
 */
export const ERROR_CODE = {
	UNKNOWN: "UNKNOWN",
	INVALID_INPUT: "INVALID_INPUT",
} as const;

export type ERROR_CODE = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

/**
 * Authentication/authorization error codes
 */
export const AUTH_ERROR_CODE = {
	RATE_LIMITED: "RATE_LIMITED",
	UNAUTHORIZED: "UNAUTHORIZED",
	DISPOSABLE_EMAIL: "DISPOSABLE_EMAIL",
	NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
} as const;

export type AUTH_ERROR_CODE =
	(typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];

/**
 * User error codes (database/business logic)
 */
export const USER_ERROR_CODE = {
	USER_NOT_FOUND: "USER_NOT_FOUND",
	USER_CREATE_FAILED: "USER_CREATE_FAILED",
	USER_UPDATE_FAILED: "USER_UPDATE_FAILED",
	USER_DELETE_FAILED: "USER_DELETE_FAILED",
} as const;

export type USER_ERROR_CODE =
	(typeof USER_ERROR_CODE)[keyof typeof USER_ERROR_CODE];

/**
 * Clerk API error codes
 */
export const CLERK_ERROR_CODE = {
	AUTHENTICATION_FAILED: "CLERK_AUTHENTICATION_FAILED",
	CREATE_USER_FAILED: "CLERK_CREATE_USER_FAILED",
	DELETE_USER_FAILED: "CLERK_DELETE_USER_FAILED",
	EMAIL_VERIFICATION_FAILED: "CLERK_EMAIL_VERIFICATION_FAILED",
	SEND_VERIFICATION_EMAIL_FAILED: "CLERK_SEND_VERIFICATION_EMAIL_FAILED",
	RESET_PASSWORD_FAILED: "CLERK_RESET_PASSWORD_FAILED",
} as const;

export type CLERK_ERROR_CODE =
	(typeof CLERK_ERROR_CODE)[keyof typeof CLERK_ERROR_CODE];

/**
 * Billing error codes
 */
export const BILLING_ERROR_CODE = {
	SUBSCRIPTION_CANCEL_FAILED: "SUBSCRIPTION_CANCEL_FAILED",
	CUSTOMER_DELETE_FAILED: "CUSTOMER_DELETE_FAILED",
	PRODUCTS_SYNC_FAILED: "PRODUCTS_SYNC_FAILED",
	CHECKOUT_FAILED: "CHECKOUT_FAILED",
} as const;

export type BILLING_ERROR_CODE =
	(typeof BILLING_ERROR_CODE)[keyof typeof BILLING_ERROR_CODE];

/**
 * Email error codes
 */
export const EMAIl_ERROR_CODE = {
	SEND_FAILED: "EMAIL_SEND_FAILED",
	INVALID_RECIPIENT: "EMAIL_INVALID_RECIPIENT",
} as const;

export type EMAIl_ERROR_CODE =
	(typeof EMAIl_ERROR_CODE)[keyof typeof EMAIl_ERROR_CODE];

/**
 * User-facing error messages (safe to display)
 */
export const ERROR_MESSAGE = {
	UNAUTHORIZED: "You are not authorized to perform this action",
	NOT_AUTHENTICATED: "Please sign in to continue",
	USER_NOT_FOUND: "User not found",
	RATE_LIMITED: "Too many attempts. Please try again later",
	UNKNOWN: "Something went wrong. Please try again",
} as const;

export type ERROR_MESSAGE = (typeof ERROR_MESSAGE)[keyof typeof ERROR_MESSAGE];
