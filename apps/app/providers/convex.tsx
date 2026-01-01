"use client";

import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
	AuthKitProvider,
	useAccessToken,
	useAuth,
} from "@workos-inc/authkit-nextjs/components";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { type ReactNode, useCallback, useState } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
	const [convex] = useState(() => {
		const url = process.env.NEXT_PUBLIC_CONVEX_URL;
		if (!url) {
			throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
		}
		return new ConvexReactClient(url);
	});

	const convexQueryClient = new ConvexQueryClient(convex);
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});
	convexQueryClient.connect(queryClient);
	return (
		<AuthKitProvider>
			<ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</ConvexProviderWithAuth>
		</AuthKitProvider>
	);
}

function useAuthFromAuthKit() {
	const { user, loading: isLoading } = useAuth();
	const { getAccessToken, refresh } = useAccessToken();

	const isAuthenticated = !!user;

	const fetchAccessToken = useCallback(
		async ({
			forceRefreshToken,
		}: {
			forceRefreshToken?: boolean;
		} = {}): Promise<string | null> => {
			if (!user) {
				return null;
			}

			try {
				if (forceRefreshToken) {
					return (await refresh()) ?? null;
				}

				return (await getAccessToken()) ?? null;
			} catch (error) {
				console.error("Failed to get access token:", error);
				return null;
			}
		},
		[user, refresh, getAccessToken],
	);

	return {
		isLoading,
		isAuthenticated,
		fetchAccessToken,
	};
}
