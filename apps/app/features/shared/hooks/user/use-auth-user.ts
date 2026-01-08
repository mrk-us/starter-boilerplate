"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";

export function useAuthUser() {
	const { user, loading } = useAuth();

	return {
		user,
		isLoading: loading,
		isAuthenticated: !!user,
	};
}
