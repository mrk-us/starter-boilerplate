"use client";

import { api } from "@repo/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";

export function useCurrentUser() {
	const { isLoading, isAuthenticated } = useConvexAuth();
	const user = useQuery(api.users.queries.getUserWithSubscription);

	return {
		user,
		isLoading,
		isAuthenticated,
	};
}
