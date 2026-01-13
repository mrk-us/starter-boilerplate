"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "@workos-inc/authkit-nextjs";
import { useRouter } from "next/navigation";

export function useDeleteAccount() {
	const router = useRouter();

	const deleteUser = useConvexAction(api.users.actions.deleteUser);

	const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
		mutationFn: async () => {
			await deleteUser();
			await signOut();
		},
		onSuccess: () => {
			router.push("/sign-in");
		},
		onError: (error) => {
			console.error(getErrorMessage(error));
		},
	});

	return {
		deleteAccount: mutateAsync,
		isPending,
		isError,
		error: error instanceof Error ? error.message : null,
		isSuccess,
	};
}
