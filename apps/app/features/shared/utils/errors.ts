import { ConvexError } from "convex/values";

// Handles ConvexError with data.message, standard Error, and unknown errors.
export function getErrorMessage(error: unknown): string {
	if (error instanceof ConvexError) {
		const data = error.data as { message?: string };
		return data?.message ?? "An error occurred";
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "An unexpected error occurred";
}
