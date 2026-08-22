"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { type ReactNode, useState } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Both clients hold live subscriptions, so they are built once per mount
  // rather than on every render.
  const [{ convex, queryClient }] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }

    const convexClient = new ConvexReactClient(url);
    const convexQueryClient = new ConvexQueryClient(convexClient);
    const tanstackQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: convexQueryClient.queryFn(),
          queryKeyHashFn: convexQueryClient.hashFn(),
        },
      },
    });

    convexQueryClient.connect(tanstackQueryClient);

    return { convex: convexClient, queryClient: tanstackQueryClient };
  });

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProviderWithClerk>
  );
}
