"use client";

import { useUploadFile } from "@convex-dev/r2/react";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";

type UseUploadAvatarReturn = {
	upload: (file: File) => Promise<{ success: boolean; key: string }>;
	remove: () => Promise<{ success: boolean }>;
	isUploading: boolean;
	isRemoving: boolean;
	isPending: boolean;
};

export function useUploadAvatar(): UseUploadAvatarReturn {
	const [isUploading, setIsUploading] = useState(false);

	// Hook from @convex-dev/r2 for uploading files to R2
	// Pass the r2 module which exports generateUploadUrl and syncMetadata
	const uploadFile = useUploadFile(api.r2);

	// Mutation to update the user's profile picture URL after upload
	const convexMutation = useConvexMutation(
		api.users.mutations.updateProfilePicture,
	);

	const { mutateAsync: updateProfilePicture, isPending: isUpdating } =
		useMutation({
			mutationFn: (key: string) => convexMutation({ key }),
		});

	// Mutation to remove the profile picture
	const removeConvexMutation = useConvexMutation(
		api.users.mutations.removeProfilePicture,
	);

	const { mutateAsync: removeProfilePicture, isPending: isRemoving } =
		useMutation({
			mutationFn: () => removeConvexMutation({}),
		});

	const upload = useCallback(
		async (file: File) => {
			try {
				setIsUploading(true);

				// Validate file type
				const validTypes = [
					"image/jpeg",
					"image/png",
					"image/gif",
					"image/webp",
				];
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

				// Upload the file to R2
				const key = await uploadFile(file);

				// Update the user's profile picture URL
				await updateProfilePicture(key);

				return { success: true, key };
			} catch (error) {
				throw error instanceof Error
					? error
					: new Error("Failed to upload avatar");
			} finally {
				setIsUploading(false);
			}
		},
		[uploadFile, updateProfilePicture],
	);

	const remove = useCallback(async () => {
		await removeProfilePicture();
		return { success: true };
	}, [removeProfilePicture]);

	return {
		upload,
		remove,
		isUploading: isUploading || isUpdating,
		isRemoving,
		isPending: isUploading || isUpdating || isRemoving,
	};
}
