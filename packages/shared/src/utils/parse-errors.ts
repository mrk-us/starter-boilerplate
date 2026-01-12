import { ConvexError } from "convex/values";
import type { AppError } from "./types";
import { UNKNOWN_ERROR } from "./types";

/** WorkOS error structure */
type WorkOSErrorShape = {
	code?: string;
	message?: string;
	errors?: Array<{ code: string; message: string }>;
};

/** Check if error looks like a WorkOS API error */
function isWorkOSError(error: unknown): error is WorkOSErrorShape {
	if (!error || typeof error !== "object") return false;
	const err = error as WorkOSErrorShape;
	return Array.isArray(err.errors) || typeof err.message === "string";
}

/**
 * Parse any error into a typed AppError
 * Handles: ConvexError, WorkOS errors, HTTP client errors, standard Error, unknown
 */
export function parseAppError(error: unknown): AppError {
	// 1. ConvexError from Convex SDK (has .data property)
	if (error instanceof ConvexError) {
		const data = error.data as { code?: string; message?: string };
		return {
			code: data?.code ?? UNKNOWN_ERROR.code,
			message: data?.message ?? UNKNOWN_ERROR.message,
		};
	}

	// 2. WorkOS API errors (have errors[] array or message property)
	if (isWorkOSError(error)) {
		// Check nested errors array first (more specific)
		if (error.errors?.length) {
			return {
				code: error?.errors?.[0]?.code ?? UNKNOWN_ERROR.code,
				message: error?.errors?.[0]?.message ?? UNKNOWN_ERROR.message,
			};
		}
		// Fall back to top-level message
		if (error.message) {
			return {
				code: error.code ?? UNKNOWN_ERROR.code,
				message: error.message,
			};
		}
	}

	// 3. ConvexError from HTTP client (embedded in error message as JSON)
	if (error instanceof Error) {
		const match = error.message.match(/ConvexError: ({.*})/);
		if (match?.[1]) {
			try {
				const parsed = JSON.parse(match[1]) as {
					code?: string;
					message?: string;
				};
				return {
					code: parsed.code ?? UNKNOWN_ERROR.code,
					message: parsed.message ?? UNKNOWN_ERROR.message,
				};
			} catch {
				// JSON parse failed, fall through
			}
		}
		// Standard Error
		return { code: UNKNOWN_ERROR.code, message: error.message };
	}

	// 4. Unknown error
	return UNKNOWN_ERROR;
}

/**
 * Convenience: extract just the message (for simple display)
 */
export function getErrorMessage(error: unknown): string {
	return parseAppError(error).message;
}

/**
 * Convenience: extract just the error code (for error type checking)
 */
export function getErrorCode(error: unknown): string {
	return parseAppError(error).code;
}
