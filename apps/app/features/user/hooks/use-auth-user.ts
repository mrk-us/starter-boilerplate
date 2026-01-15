"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";

export function useAuthUser() {
	const { user } = useUser();
	const { isLoading, isAuthenticated } = useConvexAuth();

	return {
		user,
		isLoading,
		isAuthenticated,
	};
}
