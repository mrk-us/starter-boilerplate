import { UNKNOWN_ERROR } from "../errors";
import type { AppError } from "../errors/types";

const CONVEX_ERROR_PATTERN = /ConvexError: ({.*})/;
// Convex adds this to server failures that are not a ConvexError
const CONVEX_SERVER_FAILURE_PATTERN = /\[Request ID: [^\]]*\]/;

/** Structured API error response: a top-level message and/or an errors[] array */
interface ApiErrorShape {
  code?: string;
  errors?: Array<{ code: string; message: string }>;
  message?: string;
}

interface DataErrorShape {
  data: {
    code?: string;
    message?: string;
  };
}

function isDataError(error: unknown): error is DataErrorShape {
  if (!(error && typeof error === "object" && "data" in error)) {
    return false;
  }
  const { data } = error;
  return Boolean(data && typeof data === "object");
}

/** Check if error looks like a structured API error */
function isApiError(error: unknown): error is ApiErrorShape {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as ApiErrorShape;
  return Array.isArray(err.errors) || typeof err.message === "string";
}

function parseRelayedConvexError(message: string): AppError | undefined {
  const match = message.match(CONVEX_ERROR_PATTERN);
  if (!match?.[1]) {
    return undefined;
  }
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
    return undefined;
  }
}

/**
 * Parse any error into a typed AppError
 * Handles: ConvexError, Convex server failures, structured API errors, HTTP client errors, standard Error, unknown
 */
export function parseAppError(error: unknown): AppError {
  // 1. Structured errors that expose their payload through `.data`.
  if (isDataError(error)) {
    return {
      code: error.data.code ?? UNKNOWN_ERROR.code,
      message: error.data.message ?? UNKNOWN_ERROR.message,
    };
  }

  // 2. ConvexError relayed by the HTTP client, which flattens it into a plain
  // Error whose message embeds the original payload. This has to be tried
  // before the structured-API shape check, which matches any object with a
  // message.
  if (error instanceof Error) {
    const relayedError = parseRelayedConvexError(error.message);
    if (relayedError) {
      return relayedError;
    }

    // 3. Other Convex server failures. Their message can contain function paths
    // and stack text, so it goes to the log and not to the user.
    if (CONVEX_SERVER_FAILURE_PATTERN.test(error.message)) {
      console.error(error);
      return UNKNOWN_ERROR;
    }
  }

  // 4. Structured API errors (have errors[] array or message property)
  if (isApiError(error)) {
    // Check nested errors array first (more specific)
    const [nestedError] = error.errors ?? [];
    if (nestedError) {
      return {
        code: nestedError.code,
        message: nestedError.message,
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

  // 5. Standard Error
  if (error instanceof Error) {
    return { code: UNKNOWN_ERROR.code, message: error.message };
  }

  // 6. Unknown error
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
