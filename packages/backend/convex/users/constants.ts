/*
 * Profile picture configuration
 */
export const PROFILE_PICTURE_VALIDATION = {
	maxSizeBytes: 5 * 1024 * 1024, // 5MB
	maxSizeMB: 5,
	allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"] as const,
	allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"] as const,
} as const;

/*
 * Profile picture URL expiration in seconds
 */
export const PROFILE_PICTURE_URL_EXPIRY = 12 * 60 * 60; // 12 hours
