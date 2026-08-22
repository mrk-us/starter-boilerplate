"use client";

import { useUploadFile } from "@convex-dev/r2/react";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { profilePictureUploadSchema } from "@repo/backend/convex/users/validation";
import { useMutation } from "@tanstack/react-query";

export function useUploadAvatar() {
	// R2 upload hook - handles generate URL → upload → sync metadata
	const uploadFile = useUploadFile(api.r2);

	// Mutations for profile picture management
	const updateProfilePicture = useConvexMutation(
		api.users.mutations.updateProfilePicture,
	);
	const removeProfilePicture = useConvexMutation(
		api.users.mutations.removeProfilePicture,
	);

	// Upload avatar: validate → upload to R2 → save key to profile
	const {
		mutateAsync: upload,
		isPending: isUploading,
		error: uploadError,
	} = useMutation({
		mutationFn: async (file: File) => {
			// Validate file
			const validation = profilePictureUploadSchema.safeParse({
				type: file.type,
				size: file.size,
			});

			if (!validation.success) {
				throw new Error(validation.error.issues[0]?.message);
			}

			// Upload to R2 (returns the object key)
			const key = await uploadFile(file);

			// Save the key to user's profile (handles deleting old picture)
			await updateProfilePicture({ key });

			return { success: true, key };
		},
	});

	// Remove avatar
	const {
		mutateAsync: remove,
		isPending: isRemoving,
		error: removeError,
	} = useMutation({
		mutationFn: async () => {
			await removeProfilePicture({});
			return { success: true };
		},
	});

	return {
		upload,
		remove,
		isUploading,
		isRemoving,
		isPending: isUploading || isRemoving,
		error: uploadError || removeError,
	};
}
