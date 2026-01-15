"use client";

import { useClerk } from "@clerk/nextjs";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useDeleteAccount() {
	const router = useRouter();
	const { signOut } = useClerk();

	const deleteUser = useConvexAction(api.users.actions.deleteUser);

	const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
		mutationFn: async () => {
			// Delete user (also deletes from Clerk)
			await deleteUser();
			// Sign out locally
			await signOut();
		},
		onSuccess: () => {
			// Redirect to sign-in page
			router.push("/sign-in");
		},
		onError: (err) => {
			console.error("Delete account error:", getErrorMessage(err));
		},
	});

	return {
		deleteAccount: mutateAsync,
		isPending,
		isError,
		error: error ? getErrorMessage(error) : null,
		isSuccess,
	};
}
