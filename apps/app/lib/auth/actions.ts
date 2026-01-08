"use server";

import { api } from "@repo/backend/convex/_generated/api";
import { saveSession } from "@workos-inc/authkit-nextjs";
import { ConvexHttpClient } from "convex/browser";
import { headers } from "next/headers";
import { extractErrorMessage } from "@/lib/utils";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
	throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(convexUrl);

////////////////////////////////////////////////////////////
// Sign in and save session
////////////////////////////////////////////////////////////
export async function signIn(data: { email: string; password: string }) {
	const headersList = await headers();
	const host = headersList.get("host") || "localhost:3001";
	const protocol = host.includes("localhost") ? "http" : "https";
	const url = `${protocol}://${host}/sign-in`;

	try {
		// Authenticate via Convex backend
		const authResult = await client.action(
			api.auth.actions.authenticateWithPassword,
			{
				email: data.email,
				password: data.password,
			},
		);

		// Save session (tokens stay server-side)
		await saveSession(
			{
				accessToken: authResult.accessToken,
				refreshToken: authResult.refreshToken,
				user: authResult.user,
				impersonator: undefined,
			},
			url,
		);

		return { success: true };
	} catch (error) {
		throw new Error(extractErrorMessage(error));
	}
}
