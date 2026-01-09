interface WorkOSError {
	code?: string;
	message?: string;
	errors?: Array<{ code: string; message: string }>;
}

/**
 * Get the error message from a WorkOS error
 */
export function getWorkOSErrorMessage(error: unknown): string | null {
	const err = error as WorkOSError;

	// Check nested errors array first (more specific)
	if (err?.errors?.length) {
		return err.errors[0].message;
	}

	// Fall back to top-level message
	if (err?.message) {
		return err.message;
	}

	return null;
}
