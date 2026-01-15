"use client";

import { useUser } from "@clerk/nextjs";
import { userSchema } from "@repo/backend/convex/users/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { z } from "zod";
import { useCompleteSetup } from "@/features/setup/hooks";

const nameFormSchema = z.object({
	name: userSchema.shape.name,
});

export function CompleteSetup() {
	const { user: authUser } = useUser();
	const { completeSetup } = useCompleteSetup();

	// Pre-fill with Auth provider's user's name if available
	const defaultName = authUser?.firstName ?? "";

	const form = useAppForm({
		defaultValues: {
			name: defaultName,
		},
		validators: {
			onSubmit: nameFormSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await completeSetup(value.name);

					// Small delay to ensure session token is fully refreshed
					await new Promise((resolve) => setTimeout(resolve, 500));

					// Full page reload to ensure middleware sees the updated session claims
					window.location.href = "/";
				} catch (error) {
					// log errors
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<Form form={form}>
			<form.AppField name="name">
				{(field) => <field.Input label="What should we call you?" autoFocus />}
			</form.AppField>

			<form.Errors />

			<FormSubmit
				label="Continue"
				isPending={form.state.isSubmitting}
				hasChanged={(values) => values.name !== ""}
			/>
		</Form>
	);
}
