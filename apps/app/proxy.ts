import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PUBLIC_ROUTE_PATTERNS } from "./lib/routes";

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);

/**
 * Everything is protected unless it is one of the auth screens.
 *
 * Setup completion is enforced client-side by `SetupGuard`: it lives in Convex,
 * and Clerk's session token does not carry it.
 */
export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    const { userId } = await auth();

    if (userId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
