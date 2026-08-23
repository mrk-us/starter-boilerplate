import { useUser } from "@clerk/tanstack-react-start";
import { useConvexMutation } from "@convex-dev/react-query";
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
 * browser has already navigated into the app. Writing the row as soon as Convex
 * accepts the session keeps the dashboard and the setup flow from waiting on it.
 */
export function useEnsureUser() {
  const { user: clerkUser } = useUser();
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  const upsertUser = useConvexMutation(api.users.mutations.upsertUser);

  const { mutate, status } = useMutation({
    mutationFn: upsertUser,
    onError: (error) => {
      console.error(getErrorMessage(error));
    },
    retry: PROVISION_RETRIES,
  });

  /**
   * Deleting an account removes the Convex row while the Clerk session is still
   * live, which is indistinguishable from a user who was never provisioned.
   * Remembering that a row existed keeps that window from resurrecting it.
   */
  const hasSeenUserRow = useRef(false);

  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  const name = clerkUser?.fullName ?? undefined;
  const profilePictureUrl = clerkUser?.hasImage
    ? clerkUser.imageUrl
    : undefined;

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    if (user) {
      hasSeenUserRow.current = true;
      return;
    }

    // Only ever fired from `idle`: none of the inputs change when the mutation
    // fails, so anything else would retry forever. React Query's own bounded
    // policy owns the retries.
    if (status !== "idle" || hasSeenUserRow.current || !email) {
      return;
    }

    mutate({ email, name, profilePictureUrl });
  }, [
    email,
    isAuthenticated,
    isLoading,
    mutate,
    name,
    profilePictureUrl,
    status,
    user,
  ]);
}
