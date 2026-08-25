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
  RATE_LIMITED: "Too many attempts. Please try again later",
  UNAUTHORIZED: "You are not authorized to perform this action",
  UNKNOWN: "Something went wrong. Please try again",
  USER_NOT_FOUND: "User not found",
} as const;
