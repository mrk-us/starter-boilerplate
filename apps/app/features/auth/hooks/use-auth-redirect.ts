"use client";

import type { SetActiveNavigate } from "@clerk/nextjs/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * `clerkMiddleware` bounces unauthenticated visitors to
 * `/sign-in?redirect_url=<absolute url>`. Only same-origin destinations are
 * honoured, otherwise the sign-in page would double as an open redirect.
 */
function resolveDestination(redirectUrl: string | null): string {
  if (!redirectUrl) {
    return "/";
  }

  const destination = new URL(redirectUrl, window.location.origin);

  return destination.origin === window.location.origin
    ? `${destination.pathname}${destination.search}`
    : "/";
}

/**
 * Where to send the browser once Clerk has an active session
 */
export function useAuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");

  // Resolved lazily because it reads `window.location` and these forms are
  // server-rendered before they hydrate.
  const getDestination = useCallback(
    () => resolveDestination(redirectUrl),
    [redirectUrl]
  );

  const navigate = useCallback<SetActiveNavigate>(
    ({ decorateUrl }) => {
      // `decorateUrl` can hand back a Clerk-hosted URL that refreshes the
      // session cookie for Safari's ITP, which needs a full page load.
      const url = decorateUrl(getDestination());

      if (url.startsWith("http")) {
        window.location.href = url;
        return;
      }

      router.push(url);
    },
    [getDestination, router]
  );

  return { getDestination, navigate };
}
