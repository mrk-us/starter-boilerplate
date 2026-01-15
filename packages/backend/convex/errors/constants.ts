/**
 * General error codes
 */
export const ErrorCode = {
	UNKNOWN: "UNKNOWN",
	INVALID_INPUT: "INVALID_INPUT",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Authentication/authorization error codes
 */
export const AuthErrorCode = {
	RATE_LIMITED: "RATE_LIMITED",
	UNAUTHORIZED: "UNAUTHORIZED",
	DISPOSABLE_EMAIL: "DISPOSABLE_EMAIL",
	NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * User error codes (database/business logic)
 */
export const UserErrorCode = {
	USER_NOT_FOUND: "USER_NOT_FOUND",
	USER_CREATE_FAILED: "USER_CREATE_FAILED",
	USER_UPDATE_FAILED: "USER_UPDATE_FAILED",
	USER_DELETE_FAILED: "USER_DELETE_FAILED",
} as const;

export type UserErrorCode = (typeof UserErrorCode)[keyof typeof UserErrorCode];

/**
 * Clerk API error codes
 */
export const ClerkErrorCode = {
	AUTHENTICATION_FAILED: "CLERK_AUTHENTICATION_FAILED",
	CREATE_USER_FAILED: "CLERK_CREATE_USER_FAILED",
	DELETE_USER_FAILED: "CLERK_DELETE_USER_FAILED",
	EMAIL_VERIFICATION_FAILED: "CLERK_EMAIL_VERIFICATION_FAILED",
	SEND_VERIFICATION_EMAIL_FAILED: "CLERK_SEND_VERIFICATION_EMAIL_FAILED",
	RESET_PASSWORD_FAILED: "CLERK_RESET_PASSWORD_FAILED",
} as const;

export type ClerkErrorCode =
	(typeof ClerkErrorCode)[keyof typeof ClerkErrorCode];

/**
 * Billing error codes
 */
export const BillingErrorCode = {
	SUBSCRIPTION_CANCEL_FAILED: "SUBSCRIPTION_CANCEL_FAILED",
	CUSTOMER_DELETE_FAILED: "CUSTOMER_DELETE_FAILED",
	PRODUCTS_SYNC_FAILED: "PRODUCTS_SYNC_FAILED",
	CHECKOUT_FAILED: "CHECKOUT_FAILED",
} as const;

export type BillingErrorCode =
	(typeof BillingErrorCode)[keyof typeof BillingErrorCode];

/**
 * Email error codes
 */
export const EmailErrorCode = {
	SEND_FAILED: "EMAIL_SEND_FAILED",
	INVALID_RECIPIENT: "EMAIL_INVALID_RECIPIENT",
} as const;

export type EmailErrorCode =
	(typeof EmailErrorCode)[keyof typeof EmailErrorCode];

/**
 * User-facing error messages (safe to display)
 */
export const ErrorMessage = {
	UNAUTHORIZED: "You are not authorized to perform this action",
	NOT_AUTHENTICATED: "Please sign in to continue",
	USER_NOT_FOUND: "User not found",
	RATE_LIMITED: "Too many attempts. Please try again later",
	UNKNOWN: "Something went wrong. Please try again",
} as const;
