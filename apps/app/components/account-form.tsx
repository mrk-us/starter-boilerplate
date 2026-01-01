"use client";

import { nameSchema } from "@repo/backend/convex/users/validation";
import { FieldGroup } from "@repo/ui/components/field";
import type z from "zod";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useUpdateName } from "@/hooks/users/use-update-name";
import { Form } from "./form/form";
import { FormSubmit } from "./form/form-submit";
import { useAppForm } from "./form/hooks";

// Validation schema
const accountFormSchema = nameSchema;

type FormData = z.infer<typeof accountFormSchema>;

export function AccountForm() {
	const { user } = useCurrentUser();
	const { update, isPending } = useUpdateName();

	const form = useAppForm({
		defaultValues: {
			name: user?.name?.trim() ?? "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: accountFormSchema,
		},
		onSubmit: async ({ value }) => {
			const result = accountFormSchema.safeParse(value);
			if (result.success) {
				await update(result.data.name);
				form.reset();
			}
		},
	});

	return (
		<main className="flex flex-col mx-auto max-w-lg gap-10 p-6 justify-center items-center">
			<h1>Account</h1>

			<pre>
				<code className="text-xs font-mono whitespace-pre-wrap">
					{JSON.stringify(user, null, 2)}
				</code>
			</pre>

			<Form form={form} className="w-full">
				<FieldGroup>
					<form.AppField name="name">
						{(field) => <field.Input label="Name" />}
					</form.AppField>

					<FormSubmit
						label="Save"
						isPending={isPending}
						hasChanged={(values) => values.name !== user?.name}
					/>
				</FieldGroup>
			</Form>
		</main>
	);
}
