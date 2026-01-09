"use client";

import { api } from "@repo/backend/convex/_generated/api";
import type { UserWithSubscription } from "@repo/backend/convex/users/types";
import { useConvexAuth, useQuery } from "convex/react";

type UseCurrentUserReturn = {
	isLoading: boolean;
	isAuthenticated: boolean;
	user: UserWithSubscription | null;
};

export function useCurrentUser(): UseCurrentUserReturn {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	const user = useQuery(api.users.queries.getCurrentUser);

	return {
		isLoading: authLoading || (isAuthenticated && user === undefined),
		isAuthenticated: isAuthenticated && user !== null,
		user: user ?? null,
	};
}
