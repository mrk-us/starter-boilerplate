import { ConvexError } from "convex/values";
import type { AppError } from "./types";
import { UNKNOWN_ERROR } from "./types";

/**
 * Parse any error into a typed AppError
 * Handles: ConvexError (SDK), ConvexError (HTTP client string), Error, unknown
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

	// 2. ConvexError from HTTP client (embedded in error message as JSON)
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

	// 3. Unknown error
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
