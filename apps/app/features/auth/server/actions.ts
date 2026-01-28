"use server";

import { api } from "@repo/backend/convex/_generated/api";
import { tryCatch } from "@repo/shared";
import { saveSession } from "@workos-inc/authkit-nextjs";
import type { User } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { headers } from "next/headers";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
	throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(convexUrl);

/**
 * Check if user exists in Convex DB
 */
export async function userExistsInDb(authId: string): Promise<boolean> {
	return client.query(api.users.queries.userExistsByAuthId, { authId });
}

/**
 * Sync user to Convex DB after WorkOS authentication
 * Returns true if new user was created, false if already exists
 */
export async function syncUserToDb(user: User): Promise<boolean> {
	const exists = await userExistsInDb(user.id);

	if (exists) return false;

	await client.mutation(api.users.mutations.upsertUser, {
		authId: user.id,
		email: user.email,
		name: user.firstName ?? undefined,
		profilePictureUrl: user.profilePictureUrl ?? undefined,
	});
	return true;
}

/**
 * Sign in with email/password and save session
 */
export async function signIn(data: { email: string; password: string }) {
	const headersList = await headers();
	const host = headersList.get("host") || "localhost:3001";
	const protocol = host.includes("localhost") ? "http" : "https";
	const url = `${protocol}://${host}/sign-in`;

	const { data: authResultData, error: authResultError } = await tryCatch(
		client.action(api.auth.actions.authenticateWithPassword, {
			email: data.email,
			password: data.password,
		}),
	);

	if (authResultError) {
		throw new Error(authResultError.message);
	}

	// Sync user to Convex DB
	await syncUserToDb(authResultData.user);

	// Save session (tokens stay server-side)
	await saveSession(
		{
			accessToken: authResultData.accessToken,
			refreshToken: authResultData.refreshToken,
			user: authResultData.user,
			impersonator: undefined,
		},
		url,
	);

	return { success: true };
}
