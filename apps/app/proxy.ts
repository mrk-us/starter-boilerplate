import { authkit } from "@workos-inc/authkit-nextjs";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Unauthenticated paths
 */
const UNAUTHENTICATED_PATHS = [
	"/sign-in",
	"/sign-up",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/callback",
];

function isUnauthenticatedPath(pathname: string): boolean {
	return UNAUTHENTICATED_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
}

/**
 * Custom AuthKit proxy that redirects to sign-in page
 */
export default async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Get session info using AuthKit
	const { session, headers } = await authkit(request, {
		eagerAuth: true,
	});

	// Allow paths that don't require authentication
	if (isUnauthenticatedPath(pathname)) {
		return NextResponse.next({ headers });
	}

	// Redirect unauthenticated users to sign-in
	if (!session.user) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl, { headers });
	}

	return NextResponse.next({ headers });
}

export const config = {
	matcher: [
		// Skip Next.js internals and all static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
