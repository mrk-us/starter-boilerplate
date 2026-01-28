import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";
import { isPublicPath, isSetupPath } from "./lib/routes";

/**
 * AuthKit proxy with custom redirect logic and setup route handling
 *
 * Note: Setup completion check (onboarding) is handled at the page/layout level
 * via SetupGuard since WorkOS session doesn't include custom metadata.
 */
export default async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Get session info using AuthKit
	const { session, headers } = await authkit(request);

	const isPublic = isPublicPath(pathname);
	const isSetup = isSetupPath(pathname);

	// Redirect authenticated users away from auth pages
	if (session.user && isPublic) {
		return handleAuthkitHeaders(request, headers, { redirect: "/" });
	}

	// Allow public routes without authentication
	if (isPublic) {
		return handleAuthkitHeaders(request, headers);
	}

	// Redirect unauthenticated users to sign-in
	if (!session.user) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return handleAuthkitHeaders(request, headers, {
			redirect: signInUrl.toString(),
		});
	}

	// TODO: Get setupComplete from db or workos
	// Allow access to setup route for authenticated users
	if (isSetup) {
		return handleAuthkitHeaders(request, headers);
	}

	// For all other authenticated routes, continue
	// Setup completion enforcement is handled by SetupGuard at the layout level
	return handleAuthkitHeaders(request, headers);
}

export const config = {
	matcher: [
		// Skip Next.js internals and all static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
