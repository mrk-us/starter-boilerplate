import type {
	AUTH_ERROR_CODE,
	BILLING_ERROR_CODE,
	EMAIL_ERROR_CODE,
	ERROR_CODE,
	ERROR_MESSAGE,
	USER_ERROR_CODE,
} from "./constants";

/**
 * General error codes
 */
export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

/**
 * Authentication/authorization error codes
 */
export type AuthErrorCode =
	(typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];

/**
 * User error codes
 */
export type UserErrorCode =
	(typeof USER_ERROR_CODE)[keyof typeof USER_ERROR_CODE];

/**
 * Billing error codes
 */
export type BillingErrorCode =
	(typeof BILLING_ERROR_CODE)[keyof typeof BILLING_ERROR_CODE];

/**
 * Email error codes
 */
export type EmailErrorCode =
	(typeof EMAIL_ERROR_CODE)[keyof typeof EMAIL_ERROR_CODE];

/**
 * User-facing error messages
 */
export type ErrorMessage = (typeof ERROR_MESSAGE)[keyof typeof ERROR_MESSAGE];
