"use client";

import { FieldGroup } from "@repo/ui/components/field";
import { Form, FormSubmit } from "@repo/ui/components/form";
import { useAppForm } from "@repo/ui/components/form/hooks";
import Link from "next/link";
import type { z } from "zod";
import { getErrorMessage } from "@/features/shared/utils/errors";
import { useSignUp } from "../hooks";
import { signUpSchema } from "../utils/validation";
import { AuthCard } from "./auth-card";
import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
	const { signUp } = useSignUp();

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: signUpSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await signUp(value);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<AuthCard
			title="Create an account"
			description="Get started with your account"
			footer={
				<p className="text-sm text-muted-foreground text-center w-full">
					Already have an account?{" "}
					<Link
						href="/sign-in"
						className="text-foreground underline underline-offset-4 hover:text-primary"
					>
						Sign in
					</Link>
				</p>
			}
		>
			<Form form={form}>
				<FieldGroup>
					<form.AppField name="email">
						{(field) => <field.Input label="Email" type="email" />}
					</form.AppField>

					<form.AppField name="password">
						{(field) => <field.Input label="Password" type="password" />}
					</form.AppField>

					<form.Errors />

					<FormSubmit
						label="Create account"
						isPending={form.state.isSubmitting}
						hasChanged={(values) =>
							values.email !== "" || values.password !== ""
						}
					/>
				</FieldGroup>
			</Form>

			<OAuthButtons />
		</AuthCard>
	);
}
