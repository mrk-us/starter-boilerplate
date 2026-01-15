import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Get the authenticated user's Clerk ID from the Convex identity
 * Returns null if not authenticated
 */
export async function getAuthId(
	ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string | null> {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) return null;

	return identity.subject;
}

/**
 * Get the authenticated user from the database
 * Returns null if not authenticated or user not found
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
	const clerkUserId = await getAuthId(ctx);

	if (!clerkUserId) return null;

	return ctx.db
		.query("users")
		.withIndex("authId", (q) => q.eq("authId", clerkUserId))
		.unique();
}

/**
 * Type for Clerk user identity from JWT
 */
export type ClerkIdentity = {
	subject: string;
	email?: string;
	emailVerified?: boolean;
	name?: string;
	pictureUrl?: string;
};
