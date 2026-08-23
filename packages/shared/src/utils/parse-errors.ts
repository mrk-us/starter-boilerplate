import { ConvexError } from "convex/values";
import { UNKNOWN_ERROR } from "../errors";
import type { AppError } from "../errors/types";

const CONVEX_ERROR_PATTERN = /ConvexError: ({.*})/;

/**
 * Clerk error structure
 *
 * Duck-typed rather than imported so this package stays dependency-free and
 * works for both `@clerk/backend` and browser SDK errors.
 */
interface ClerkErrorShape {
  clerkError?: true;
  code?: string;
  errors?: Array<{ code: string; longMessage?: string; message: string }>;
  longMessage?: string;
  message?: string;
}

function isClerkError(error: unknown): error is ClerkErrorShape {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as ClerkErrorShape;
  return err.clerkError === true || Array.isArray(err.errors);
}

/**
 * A ConvexError relayed by the HTTP client arrives as a plain `Error` whose
 * message embeds the original payload rather than as a `ConvexError`.
 */
function parseRelayedConvexError(error: Error): AppError | null {
  const match = error.message.match(CONVEX_ERROR_PATTERN);

  if (!match?.[1]) {
    return null;
  }

  try {
    const relayed = JSON.parse(match[1]) as { code?: string; message?: string };

    return {
      code: relayed.code ?? UNKNOWN_ERROR.code,
      message: relayed.message ?? UNKNOWN_ERROR.message,
    };
  } catch {
    return null;
  }
}

/**
 * Parse any error into a typed AppError
 * Handles: ConvexError, Clerk errors, HTTP client errors, standard Error, unknown
 */
export function parseAppError(error: unknown): AppError {
  // 1. ConvexError from Convex SDK (has .data property)
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; message?: string };
    return {
      code: data.code ?? UNKNOWN_ERROR.code,
      message: data.message ?? UNKNOWN_ERROR.message,
    };
  }

  // 2. ConvexError relayed by the HTTP client. This has to be tried before the
  // standard-Error branch below, which would otherwise surface the flattened
  // message.
  if (error instanceof Error) {
    const relayed = parseRelayedConvexError(error);

    if (relayed) {
      return relayed;
    }
  }

  // 3. Clerk errors. `longMessage` is the user-facing copy; `message` is aimed
  // at developers and is not guaranteed to be stable.
  if (isClerkError(error)) {
    const [apiError] = error.errors ?? [];
    if (apiError) {
      return {
        code: apiError.code,
        message: apiError.longMessage ?? apiError.message,
      };
    }
    const message = error.longMessage ?? error.message;
    if (message) {
      return {
        code: error.code ?? UNKNOWN_ERROR.code,
        message,
      };
    }
  }

  // 4. Standard Error
  if (error instanceof Error) {
    return { code: UNKNOWN_ERROR.code, message: error.message };
  }

  // 5. Unknown error
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
