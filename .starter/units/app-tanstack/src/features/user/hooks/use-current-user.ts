import { convexQuery } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { useConvexAuth } from "convex/react";

export function useCurrentUser() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  const { data: user, isPending } = useQuery({
    ...convexQuery(api.users.queries.getCurrentUser, {}),
    enabled: isAuthenticated,
  });

  // Loading if auth is loading OR (authenticated but query pending)
  const isLoading = isAuthLoading || (isAuthenticated && isPending);

  return {
    isAuthenticated,
    isLoading,
    user: user ?? null,
  };
}
