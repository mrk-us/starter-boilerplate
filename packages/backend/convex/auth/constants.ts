/**
 * Account creation error codes
 */
export const AuthErrorCode = {
	RATE_LIMITED: "RATE_LIMITED",
	UNAUTHORIZED: "UNAUTHORIZED",
	DISPOSABLE_EMAIL: "DISPOSABLE_EMAIL",
	WORKOS_ERROR: "WORKOS_ERROR",
	UNKNOWN: "UNKNOWN",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];
