import type { User, UserJSON } from "@clerk/backend";
import { ConvexError } from "convex/values";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { AUTH_ERROR_CODE, ERROR_MESSAGE } from "../errors/constants";

/**
 * Clerk user data type that supports both webhook data (UserJSON) and SDK data (User)
 */
type ClerkUserData = UserJSON | User;

/**
 * Type guard to check if data is from Clerk SDK (User) vs webhook (UserJSON)
 */
function isClerkSdkUser(data: ClerkUserData): data is User {
	return "emailAddresses" in data;
}

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
 * Require authentication - throws NOT_AUTHENTICATED if not signed in
 * Use this when authentication is required (mutations, actions)
 */
export async function requireAuthId(
	ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string> {
	const authId = await getAuthId(ctx);

	if (!authId) {
		throw new ConvexError({
			code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
			message: ERROR_MESSAGE.NOT_AUTHENTICATED,
		});
	}

	return authId;
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
 * Require authenticated user - throws NOT_AUTHENTICATED if not signed in or user not found
 * Use this when you need the user record (most mutations)
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
	const user = await getAuthenticatedUser(ctx);

	if (!user) {
		throw new ConvexError({
			code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
			message: ERROR_MESSAGE.NOT_AUTHENTICATED,
		});
	}

	return user;
}

/**
 * Get primary email from Clerk user data
 * Supports both webhook data (UserJSON) and SDK data (User)
 * Returns the email string or undefined if not found
 */
export function getPrimaryEmail(data: ClerkUserData): string | undefined {
	if (isClerkSdkUser(data)) {
		// SDK User type (camelCase)
		const email = data.emailAddresses.find(
			(e) => e.id === data.primaryEmailAddressId,
		);
		return email?.emailAddress;
	}

	// Webhook UserJSON type (snake_case)
	const email = data.email_addresses.find(
		(e) => e.id === data.primary_email_address_id,
	);
	return email?.email_address;
}

/**
 * Get full name from Clerk user data
 * Supports both webhook data (UserJSON) and SDK data (User)
 */
export function getFullName(data: ClerkUserData): string {
	if (isClerkSdkUser(data)) {
		// SDK User type (camelCase)
		const parts = [data.firstName, data.lastName].filter(Boolean);
		return parts.join(" ").trim();
	}

	// Webhook UserJSON type (snake_case)
	const parts = [data.first_name, data.last_name].filter(Boolean);
	return parts.join(" ").trim();
}
