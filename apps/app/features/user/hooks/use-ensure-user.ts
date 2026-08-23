"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useCurrentUser } from "./use-current-user";

const PROVISION_RETRIES = 2;

/**
 * Provision the Convex `users` row for the signed-in Clerk user
 *
 * Clerk's `user.created` webhook is authoritative, but it can land after the
 * browser has already navigated into the app. Asking for the row as soon as
 * Convex accepts the session keeps the dashboard and the setup flow from
 * waiting on it.
 */
export function useEnsureUser() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  const ensureUser = useConvexAction(api.users.actions.ensureUser);

  const { mutate, status } = useMutation({
    mutationFn: ensureUser,
    onError: (error) => {
      console.error(getErrorMessage(error));
    },
    // The token can be a moment older than the Convex session; anything that
    // survives a bounded backoff is left to the webhook.
    retry: PROVISION_RETRIES,
  });

  // A row that once existed must never be re-created. Deleting the account
  // removes the row while the session is still valid, and the query pushes that
  // `null` to this still-mounted hook before `signOut()` completes.
  const hasObservedUser = useRef(false);

  useEffect(() => {
    if (user) {
      hasObservedUser.current = true;
      return;
    }

    if (
      !isAuthenticated ||
      isLoading ||
      hasObservedUser.current ||
      status !== "idle"
    ) {
      return;
    }

    mutate({});
  }, [user, isAuthenticated, isLoading, status, mutate]);
}
