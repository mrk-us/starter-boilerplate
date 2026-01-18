"use client";

import { tryCatch } from "@repo/shared/utils";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverFooter,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { IconLoader2, IconTrashX, IconUser } from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";
import { useUploadAvatar } from "@/features/user/hooks";

type AvatarUploadProps = {
	currentAvatarUrl?: string | null;
	userName?: string | null;
};

export function AvatarUpload({
	currentAvatarUrl,
	userName,
}: AvatarUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<string | null>(null);
	const { upload, remove, isUploading, isPending } = useUploadAvatar();

	// Get initials from name for fallback
	const initials = userName
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const handleFileSelect = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			setError(null);

			const { error } = await tryCatch(upload(file));

			if (error) {
				setError(error.message ?? "Failed to upload image");
			}

			// Reset the input so the same file can be selected again
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[upload],
	);

	const handleRemove = useCallback(async () => {
		setError(null);

		const { error } = await tryCatch(remove());

		if (error) {
			setError(error.message ?? "Failed to remove image");
		}
	}, [remove]);

	const handleClick = useCallback(() => {
		if (!isPending) {
			fileInputRef.current?.click();
		}
	}, [isPending]);

	return (
		<div className="flex flex-col items-center gap-4">
			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/gif,image/webp"
				onChange={handleFileSelect}
				className="hidden"
				disabled={isPending}
			/>

			{/* Avatar with upload overlay */}
			<div className="relative group">
				<Avatar
					className="size-20 transition-opacity group-hover:opacity-80"
					onClick={handleClick}
				>
					{currentAvatarUrl ? (
						<AvatarImage src={currentAvatarUrl} alt={userName ?? "Avatar"} />
					) : null}
					<AvatarFallback className="text-xl">
						{initials || <IconUser className="size-8" />}
					</AvatarFallback>
				</Avatar>

				{/* Loading overlay */}
				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
						<IconLoader2 className="size-8 animate-spin text-white" />
					</div>
				)}

				{/* Upload hint overlay (shown on hover when not loading) */}
				{!isPending && (
					<Popover>
						<PopoverTrigger className="outline-none absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"></PopoverTrigger>

						<PopoverContent side="bottom">
							<PopoverHeader>
								<PopoverTitle className="text-center">
									{currentAvatarUrl ? "Update" : "Upload"} photo
								</PopoverTitle>
								<PopoverDescription className="text-center">
									{currentAvatarUrl
										? "Change or remove your photo"
										: "Personalize your profile with a photo"}
								</PopoverDescription>
							</PopoverHeader>
							<PopoverFooter className="sm:flex-col gap-1">
								<Button
									variant="primary"
									onClick={handleClick}
									disabled={isPending}
								>
									{currentAvatarUrl ? "Change" : "Upload"}
								</Button>
								{currentAvatarUrl && (
									<Button onClick={handleRemove} disabled={isPending}>
										Remove
									</Button>
								)}
							</PopoverFooter>
						</PopoverContent>
					</Popover>
				)}
			</div>

			{/* Action buttons */}
			<div className="flex gap-1">
				<Button type="button" onClick={handleClick} disabled={isPending}>
					{currentAvatarUrl ? "Change Photo" : "Upload Photo"}
				</Button>

				{currentAvatarUrl && (
					<Popover>
						<Tooltip>
							<TooltipTrigger
								render={
									<PopoverTrigger
										render={
											<Button type="button" size="icon">
												<IconTrashX className="size-4 stroke-1.5" />
											</Button>
										}
									/>
								}
							/>
							<TooltipContent>Remove avatar</TooltipContent>
						</Tooltip>
						<PopoverContent side="top">
							<PopoverHeader>
								<PopoverTitle className="text-center">
									Remove avatar
								</PopoverTitle>
								<PopoverDescription className="text-center">
									This will remove it from your profile and delete it from our
									database.
								</PopoverDescription>
							</PopoverHeader>
							<PopoverFooter>
								{/* <PopoverClose render={<Button />}>Cancel</PopoverClose> */}
								<Button
									variant="primary"
									onClick={handleRemove}
									disabled={isPending}
								>
									Remove
								</Button>
							</PopoverFooter>
						</PopoverContent>
					</Popover>
				)}
			</div>

			{/* Error message */}
			{error && (
				<p className="text-sm text-destructive text-center max-w-xs">{error}</p>
			)}
		</div>
	);
}
