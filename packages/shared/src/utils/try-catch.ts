import type { AppError } from "../errors/types";
import { parseAppError } from "./parse-errors";

/**
 * Usage examples:
 *
 * Single async call - pass Promise directly
 * ```
 * const { data, error } = await tryCatch(function(value));
 * ```
 *
 * Multiple operations or need to transform - async wrapper
 * ```
 *  const { data, error } = await tryCatch(async () => {
 *    await function(value);
 *    await new Promise(r => setTimeout(r, 500));
 *    window.location.href = "/";
 * });
 * ```
 *
 * Sync operation - no await needed
 * ```
 * const { data, error } = tryCatch(() => function(value));
 * ```
 */

interface Success<T> {
  data: T;
  error: undefined;
}
interface Failure {
  data: undefined;
  error: AppError;
}
type Result<T> = Success<T> | Failure;

/**
 * Execute a promise and return a typed result object
 */

/**
 * Execute an async function and return a typed result object
 */
export function tryCatch<T>(
  input: Promise<T> | (() => Promise<T>)
): Promise<Result<T>>;

/**
 * Execute a sync function and return a typed result object
 */
export function tryCatch<T>(fn: () => T): Result<T>;

export function tryCatch<T>(
  input: Promise<T> | (() => T) | (() => Promise<T>)
): Result<T> | Promise<Result<T>> {
  if (input instanceof Promise) {
    return input
      .then((data): Success<T> => ({ data, error: undefined }))
      .catch(
        (error): Failure => ({ data: undefined, error: parseAppError(error) })
      );
  }

  try {
    const result = input();

    // Handle async functions that return Promises
    if (result instanceof Promise) {
      return result
        .then((data): Success<T> => ({ data, error: undefined }))
        .catch(
          (error): Failure => ({
            data: undefined,
            error: parseAppError(error),
          })
        );
    }

    return { data: result, error: undefined };
  } catch (error) {
    return { data: undefined, error: parseAppError(error) };
  }
}
