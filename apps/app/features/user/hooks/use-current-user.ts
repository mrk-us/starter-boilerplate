"use client";

import { api } from "@repo/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";

export function useCurrentUser() {
	const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

	const user = useQuery(
		api.users.queries.getUserWithSubscription,
		// Only run query when authenticated
		isAuthenticated ? {} : "skip",
	);

	// Loading if auth is loading OR (authenticated but user query pending)
	const isLoading = isAuthLoading || (isAuthenticated && user === undefined);

	return {
		user: user ?? null,
		isLoading,
		isAuthenticated,
	};
}
