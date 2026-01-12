/**
 * Standard error shape for all app errors
 */
export type AppError = {
	code: string;
	message: string;
};

/**
 * Default error for unknown/unhandled cases
 */
export const UNKNOWN_ERROR: AppError = {
	code: "UNKNOWN",
	message: "An unexpected error occurred",
};
