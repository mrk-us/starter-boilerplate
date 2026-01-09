/**
 * Extract error message from Convex HTTP client errors
 */
export function extractErrorMessage(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	try {
		const match = message.match(/ConvexError: ({.*})/);
		if (match?.[1]) {
			const parsed = JSON.parse(match[1]) as { message?: string };
			return parsed.message ?? message;
		}
	} catch {
		// Parse failed, return original
	}
	return message;
}
