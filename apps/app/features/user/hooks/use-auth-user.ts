"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import type { User as WorkOSUser } from "@workos-inc/node";

type UseAuthUserReturn = {
	user: WorkOSUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
};

export function useAuthUser(): UseAuthUserReturn {
	const { user, loading } = useAuth();

	return {
		user,
		isLoading: loading,
		isAuthenticated: !!user,
	};
}
