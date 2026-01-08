"use client";

import { userSchema } from "@repo/backend/convex/users/validation";
import { Button } from "@repo/ui/components/button";
import { FieldGroup } from "@repo/ui/components/field";
import { Form, FormSubmit } from "@repo/ui/components/form";
import { useAppForm } from "@repo/ui/components/form/hooks";
import { z } from "zod";
import { AvatarUpload } from "@/features/shared/components/avatar-upload";
import { useCurrentUser } from "@/features/shared/hooks/user/use-current-user";
import { useDeleteUser } from "@/features/shared/hooks/user/use-delete-user";
import { useUpdateName } from "@/features/shared/hooks/user/use-update-name";
import { getErrorMessage } from "@/features/shared/utils";

// Validation schema
const accountFormSchema = z.object({
	name: userSchema.shape.name,
});

type FormData = z.infer<typeof accountFormSchema>;

export function AccountForm() {
	const { user } = useCurrentUser();

	const { updateName, isPending: isUpdatingName } = useUpdateName();

	const {
		deleteUser,
		isPending: isDeletingUser,
		error: deleteUserError,
	} = useDeleteUser();

	const form = useAppForm({
		defaultValues: {
			name: user?.name ?? "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: accountFormSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await updateName(value.name);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<main className="flex flex-col mx-auto max-w-lg gap-10 p-6 justify-center items-center">
			<h1>Account</h1>

			<AvatarUpload
				currentAvatarUrl={user?.profilePictureUrl}
				userName={user?.name}
			/>

			<Form form={form} className="w-full">
				<FieldGroup>
					<form.AppField name="name">
						{(field) => <field.Input label="Name" />}
					</form.AppField>

					<FormSubmit
						label="Save"
						isPending={isUpdatingName}
						hasChanged={(values) => values.name !== user?.name}
					/>
				</FieldGroup>
			</Form>

			<Button onClick={() => void deleteUser()} disabled={isDeletingUser}>
				Delete Account
			</Button>
			{deleteUserError && (
				<div className="text-red-500 text-sm">{deleteUserError}</div>
			)}
		</main>
	);
}
