import { updateUserNameSchema } from "@repo/backend/convex/users/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Form,
  FormSubmit,
  useAppForm,
} from "@repo/ui/components";
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

  const { updateName, isPending: isUpdatingName, savedName } = useUpdateName();

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
    // The hook keeps the error, and the dialog shows it
    await tryCatch(deleteAccount());
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

        <form.Errors />

        <FormSubmit
          hasChanged={(values) => values.name !== user?.name}
          isPending={isUpdatingName}
          label="Save"
        />

        <form.Subscribe selector={(state) => state.values.name}>
          {(name) =>
            name === savedName ? (
              <p className="text-sm" role="status">
                Name saved.
              </p>
            ) : null
          }
        </form.Subscribe>
      </Form>

      <AlertDialog>
        <AlertDialogTrigger render={<Button />}>
          Delete Account
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and cancels any
              subscription. You can&apos;t undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteUserError && (
            <p className="text-destructive text-sm" role="alert">
              {deleteUserError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>
              Keep Account
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingUser}
              onClick={handleDeleteAccount}
            >
              {isDeletingUser ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
