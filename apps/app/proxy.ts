import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Public routes that don't require authentication
 */
const isPublicRoute = createRouteMatcher([
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/forgot-password(.*)",
	"/reset-password(.*)",
	"/verify-email(.*)",
]);

/**
 * Setup/onboarding route
 */
const isSetupRoute = createRouteMatcher(["/setup(.*)"]);

/**
 * Clerk middleware with custom redirect logic and onboarding enforcement
 */
export default clerkMiddleware(async (auth, req) => {
	const { pathname } = req.nextUrl;

	// Get auth state including session claims
	const { userId, sessionClaims } = await auth();

	// Redirect away from auth pages if authenticated
	if (userId && isPublicRoute(req)) {
		const homeUrl = new URL("/", req.url);
		return NextResponse.redirect(homeUrl);
	}

	// Allow public routes without authentication
	if (isPublicRoute(req)) {
		return NextResponse.next();
	}

	// Redirect to sign-in if not authenticated
	if (!userId) {
		const signInUrl = new URL("/sign-in", req.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl);
	}

	// Allow access to setup route for authenticated users
	if (isSetupRoute(req)) {
		return NextResponse.next();
	}

	// Check if user has completed onboarding via session claims
	const onboardingComplete = sessionClaims?.metadata?.onboardingComplete;

	// Redirect to setup if onboarding not complete
	if (!onboardingComplete) {
		const setupUrl = new URL("/setup", req.url);
		return NextResponse.redirect(setupUrl);
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
