import { api } from "@repo/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";

// Get the current user
export function useCurrentUser() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	const user = useQuery(api.auth.queries.getCurrentUser);

	return {
		isLoading: authLoading || (isAuthenticated && user === undefined),
		isAuthenticated: isAuthenticated && user !== null,
		user: user ?? null,
	};
}
