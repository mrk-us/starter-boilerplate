"use client";

import { api } from "@repo/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";

export function useCurrentUser() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	const user = useQuery(api.users.queries.getCurrentUser);

	return {
		isLoading: authLoading || (isAuthenticated && user === undefined),
		isAuthenticated: isAuthenticated && user !== null,
		user: user ?? null,
	};
}
