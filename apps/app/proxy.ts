import { authkitMiddleware as authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy({
	eagerAuth: true,
	middlewareAuth: {
		enabled: true,
		unauthenticatedPaths: [
			"/",
			"/sign-in",
			"/sign-up",
			"/forgot-password",
			"/reset-password",
			"/verify-email",
		],
	},
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
