import { updateUserNameSchema } from "@repo/backend/convex/users/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import { Button, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { IconUser } from "@tabler/icons-react";
import { z } from "zod";
import {
  useCurrentUser,
  useDeleteAccount,
  useUpdateName,
} from "@/features/user/hooks";

// Validation schema
const accountFormSchema = z.object({
  name: updateUserNameSchema.shape.name,
});

type FormData = z.infer<typeof accountFormSchema>;

export function AccountForm() {
  const { user } = useCurrentUser();

  const { updateName, isPending: isUpdatingName } = useUpdateName();

  const {
    deleteAccount,
    isPending: isDeletingUser,
    error: deleteUserError,
  } = useDeleteAccount();

  // Get initials from name for fallback
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const form = useAppForm({
    defaultValues: {
      name: user?.name ?? "",
    } satisfies FormData as FormData,
    validators: {
      onSubmit: accountFormSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await tryCatch(updateName(value.name));

        if (error) {
          throw getErrorMessage(error);
        }
      },
    },
  });

  const handleDeleteAccount = async () => {
    await deleteAccount();
  };

  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center gap-10 p-6">
      <h1>Account</h1>

      <Avatar className="size-20">
        {user?.profilePictureUrl ? (
          <AvatarImage
            alt={user.name ?? "Avatar"}
            src={user.profilePictureUrl}
          />
        ) : null}
        <AvatarFallback className="text-xl">
          {initials || <IconUser className="size-8" />}
        </AvatarFallback>
      </Avatar>

      <Form form={form}>
        <form.AppField name="name">
          {(field) => <field.Input label="Name" />}
        </form.AppField>

        <FormSubmit
          hasChanged={(values) => values.name !== user?.name}
          isPending={isUpdatingName}
          label="Save"
        />
      </Form>

      <Button disabled={isDeletingUser} onClick={handleDeleteAccount}>
        Delete Account
      </Button>
      {deleteUserError && (
        <div className="text-red-500 text-sm">{deleteUserError}</div>
      )}
    </main>
  );
}
