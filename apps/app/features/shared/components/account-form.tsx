"use client";

import { updateUserNameSchema } from "@repo/backend/convex/users/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import {
	Button,
	FieldGroup,
	Form,
	FormSubmit,
	useAppForm,
} from "@repo/ui/components";
import { z } from "zod";
import { AvatarUpload } from "@/features/shared/components";
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

			<Button onClick={() => void deleteAccount()} disabled={isDeletingUser}>
				Delete Account
			</Button>
			{deleteUserError && (
				<div className="text-red-500 text-sm">{deleteUserError}</div>
			)}
		</main>
	);
}
