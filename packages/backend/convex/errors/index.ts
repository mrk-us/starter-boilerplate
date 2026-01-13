// Re-export from @repo/shared
export type { AppError } from "@repo/shared";

// Export error codes and messages
export {
	AuthErrorCode,
	BillingErrorCode,
	EmailErrorCode,
	ErrorCode,
	ErrorMessage,
	UserErrorCode,
	WorkOSErrorCode,
} from "./constants";
