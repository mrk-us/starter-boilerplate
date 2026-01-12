import { parseAppError } from "./parse-errors";
import type { AppError } from "./types";

type Success<T> = { data: T; error: undefined };
type Failure = { data: undefined; error: AppError };
type Result<T> = Success<T> | Failure;

/**
 * Execute a promise and return a typed result object
 */
export async function tryCatch<T>(promise: Promise<T>): Promise<Result<T>>;

/**
 * Execute a sync function and return a typed result object
 */
export function tryCatch<T>(fn: () => T): Result<T>;

export function tryCatch<T>(
	input: Promise<T> | (() => T),
): Result<T> | Promise<Result<T>> {
	if (input instanceof Promise) {
		return input
			.then((data): Success<T> => ({ data, error: undefined }))
			.catch(
				(error): Failure => ({
					data: undefined,
					error: parseAppError(error),
				}),
			);
	}

	try {
		return { data: input(), error: undefined };
	} catch (error) {
		return { data: undefined, error: parseAppError(error) };
	}
}
