"use client";

import { userSchema } from "@repo/backend/convex/users/validation";
import { Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useCompleteSetup } from "@/features/setup/hooks";
import { getErrorMessage } from "@/features/shared/utils";
import { useCurrentUser } from "@/features/user/hooks";

const nameFormSchema = z.object({
	name: userSchema.shape.name,
});

export function CompleteSetup() {
	const router = useRouter();
	const { user } = useCurrentUser();
	const { completeSetup } = useCompleteSetup();

	const form = useAppForm({
		defaultValues: {
			name: user?.name ?? "",
		},
		validators: {
			onSubmit: nameFormSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await completeSetup(value.name);
					router.push("/");
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<Form form={form}>
			<form.AppField name="name">
				{(field) => <field.Input label="Name" />}
			</form.AppField>

			<FormSubmit
				label="Continue"
				isPending={form.state.isSubmitting}
				hasChanged={(values) => values.name !== ""}
			/>
		</Form>
	);
}
