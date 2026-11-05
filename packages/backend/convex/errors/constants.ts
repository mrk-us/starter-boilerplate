/**
 * General error codes
 */
export const ERROR_CODE = {
  INVALID_INPUT: "INVALID_INPUT",
  RATE_LIMITED: "RATE_LIMITED",
  UNKNOWN: "UNKNOWN",
} as const;

/**
 * User-facing error messages
 */
export const ERROR_MESSAGE = {
  NOT_AUTHENTICATED: "Please sign in to continue",
  UNAUTHORIZED: "You are not authorized to perform this action",
  UNKNOWN: "Something went wrong. Please try again",
} as const;
