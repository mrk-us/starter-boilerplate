"use client";

import { api } from "@repo/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";

export function useCurrentUser() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	const user = useQuery(api.users.queries.getCurrentUser);

	// Loading states:
	// 1. Auth is loading
	// 2. Authenticated but user query hasn't returned yet (undefined)
	// 3. Authenticated but user record doesn't exist yet (null) - OAuth race condition
	const isLoading =
		authLoading || (isAuthenticated && (user === undefined || user === null));

	return {
		isLoading,
		isAuthenticated,
		user: user ?? null,
	};
}
