import type { AppError } from "./types";

export type { AppError } from "./types";

/**
 * Default error for unknown/unhandled cases
 */
export const UNKNOWN_ERROR: AppError = {
  code: "UNKNOWN",
  message: "An unexpected error occurred",
};
