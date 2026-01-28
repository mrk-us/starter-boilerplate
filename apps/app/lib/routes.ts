/**
 * Route configuration - single source of truth for public/protected routes
 */

/**
 * Public route patterns (glob-style for middleware)
 * These routes don't require authentication
 */
export const PUBLIC_ROUTE_PATTERNS = [
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/forgot-password(.*)",
	"/reset-password(.*)",
	"/verify-email(.*)",
	"/callback(.*)",
] as const;

/**
 * Setup/onboarding route pattern
 */
export const SETUP_ROUTE_PATTERN = "/setup(.*)";

/**
 * Check if a pathname matches any public route
 * Used for client-side route checking in AuthProvider
 */
export function isPublicPath(pathname: string): boolean {
	return PUBLIC_ROUTE_PATTERNS.some((pattern) => {
		// Convert glob pattern to regex: "/sign-in(.*)" -> /^\/sign-in.*$/
		const regexPattern = pattern.replace("(.*)", ".*");
		const regex = new RegExp(`^${regexPattern}$`);
		return regex.test(pathname);
	});
}

/**
 * Check if a pathname is the setup route
 */
export function isSetupPath(pathname: string): boolean {
	const regex = new RegExp(`^${SETUP_ROUTE_PATTERN.replace("(.*)", ".*")}$`);
	return regex.test(pathname);
}
