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

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string | null;
}

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
      if (!file) {
        return;
      }

      setError(null);

      const { error: uploadError } = await tryCatch(upload(file));

      if (uploadError) {
        setError(uploadError.message);
      }

      // Reset the input so the same file can be selected again
      // biome-ignore lint/suspicious/noUnnecessaryConditions: React assigns the DOM node after render.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [upload]
  );

  const handleRemove = useCallback(async () => {
    setError(null);

    const { error: removeError } = await tryCatch(remove());

    if (removeError) {
      setError(removeError.message);
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
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        disabled={isPending}
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />

      {/* Avatar with upload overlay */}
      <div className="group relative">
        <Avatar
          className="size-20 transition-opacity group-hover:opacity-80"
          onClick={handleClick}
        >
          {currentAvatarUrl ? (
            <AvatarImage alt={userName ?? "Avatar"} src={currentAvatarUrl} />
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
            <PopoverTrigger className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 outline-none transition-opacity group-hover:opacity-100" />

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
              <PopoverFooter className="gap-1 sm:flex-col">
                <Button
                  disabled={isPending}
                  onClick={handleClick}
                  variant="default"
                >
                  {currentAvatarUrl ? "Change" : "Upload"}
                </Button>
                {currentAvatarUrl && (
                  <Button disabled={isPending} onClick={handleRemove}>
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
        <Button disabled={isPending} onClick={handleClick} type="button">
          {currentAvatarUrl ? "Change Photo" : "Upload Photo"}
        </Button>

        {currentAvatarUrl && (
          <Popover>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PopoverTrigger
                    render={
                      <Button size="icon" type="button">
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
                  disabled={isPending}
                  onClick={handleRemove}
                  variant="default"
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
        <p className="max-w-xs text-center text-destructive text-sm">{error}</p>
      )}
    </div>
  );
}
