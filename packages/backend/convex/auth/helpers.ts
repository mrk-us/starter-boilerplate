import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

import type { ClerkUserEvent } from "./types";

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
 * Get primary email from Clerk user data
 */
export function getPrimaryEmail(data: ClerkUserEvent["data"]): string | null {
	const primaryEmail = data.email_addresses.find(
		(e) => e.id === data.primary_email_address_id,
	);
	return (
		primaryEmail?.email_address ??
		data.email_addresses[0]?.email_address ??
		null
	);
}

/**
 * Get full name from Clerk user data
 * Uses firstName as the single name field (can contain full name)
 */
export function getFullName(data: ClerkUserEvent["data"]): string {
	// We store the full name in firstName
	// If lastName exists, concatenate them
	const parts = [data.first_name, data.last_name].filter(Boolean);
	return parts.join(" ").trim();
}
