"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCurrentUser } from "./use-current-user";

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

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: upsertUser,
    onError: (error) => {
      console.error(getErrorMessage(error));
    },
  });

  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  const isMissing = isAuthenticated && !isLoading && user === null;
  const name = clerkUser?.fullName ?? undefined;
  const profilePictureUrl = clerkUser?.hasImage
    ? clerkUser.imageUrl
    : undefined;

  useEffect(() => {
    if (!(isMissing && email) || isPending || isSuccess) {
      return;
    }

    mutate({ email, name, profilePictureUrl });
  }, [email, isMissing, isPending, isSuccess, mutate, name, profilePictureUrl]);
}
