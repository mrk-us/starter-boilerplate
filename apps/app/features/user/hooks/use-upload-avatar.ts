"use client";

import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { useMutation } from "@tanstack/react-query";

export function useUploadAvatar() {
	const generateUploadUrl = useConvexMutation(
		api.storage.mutations.generateUploadUrl,
	);
	const updateProfilePicture = useConvexMutation(
		api.users.mutations.updateProfilePicture,
	);
	const removeProfilePicture = useConvexMutation(
		api.users.mutations.removeProfilePicture,
	);

	// Upload avatar: generate URL → upload file → save storage ID
	const {
		mutateAsync: upload,
		isPending: isUploading,
		error: uploadError,
	} = useMutation({
		mutationFn: async (file: File) => {
			// Validate file type
			const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
			if (!validTypes.includes(file.type)) {
				throw new Error(
					"Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
				);
			}

			// Validate file size (max 5MB)
			const maxSize = 5 * 1024 * 1024;
			if (file.size > maxSize) {
				throw new Error("File size must be less than 5MB.");
			}

			// Get a short-lived upload URL from Convex
			const uploadUrl = await generateUploadUrl({});

			// Upload the file directly to Convex storage
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!result.ok) {
				throw new Error("Failed to upload file");
			}

			const { storageId } = (await result.json()) as {
				storageId: Id<"_storage">;
			};

			// Save the storage ID to the user's profile
			await updateProfilePicture({ storageId });

			return { success: true, storageId };
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
