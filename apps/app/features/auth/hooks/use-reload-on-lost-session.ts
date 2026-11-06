"use client";

import { useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";

// Convex also reports signed out for a moment when it changes to a new token
const LOST_SESSION_GRACE_MS = 5000;

/**
 * The server redirects to sign-in only on navigation, so an open page stays
 * empty when its session ends. A reload lets the server redirect it and keep the
 * return path. Going to /sign-in directly would not work, because the server
 * sends a session that it still accepts back to the home page.
 */
export function useReloadOnLostSession() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
      return;
    }

    // A page that was never signed in has nothing to recover, and this check
    // also stops a reload loop
    if (isLoading || !wasAuthenticated.current) {
      return;
    }

    const timer = setTimeout(
      () => window.location.reload(),
      LOST_SESSION_GRACE_MS
    );

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);
}
