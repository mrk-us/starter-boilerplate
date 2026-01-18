"use client";

import { authSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import {
	FieldGroup,
	FieldSeparator,
	Form,
	FormSubmit,
	useAppForm,
} from "@repo/ui/components";
import Link from "next/link";
import { z } from "zod";
import { AuthCard, OAuthButtons } from "@/features/auth/components";
import { useSignInEmail } from "@/features/auth/hooks";

const signInEmailSchema = z.object({
	email: authSchema.shape.email,
});

type FormData = z.infer<typeof signInEmailSchema>;

export function SignInEmailForm() {
	const { validateEmail } = useSignInEmail();

	const form = useAppForm({
		defaultValues: {
			email: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: signInEmailSchema,
			onSubmitAsync: async ({ value }) => {
				const { error } = await tryCatch(async () => {
					await validateEmail(value);
				});

				if (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<AuthCard
			title="Sign in"
			footer={
				<p className="text-xs text-muted-foreground text-center w-full">
					Don't have an account?{" "}
					<Link
						href="/sign-up"
						className="text-foreground hover:underline hover:underline-offset-2"
					>
						Sign up
					</Link>
				</p>
			}
		>
			<Form form={form} className="space-y-6">
				<FieldGroup>
					<form.AppField name="email">
						{(field) => (
							<field.Input
								hideLabel
								label="Email"
								placeholder="Enter your email"
								type="email"
								autoCapitalize="off"
								autoComplete="email"
								autoFocus
							/>
						)}
					</form.AppField>
				</FieldGroup>

				<form.Errors />

				<FormSubmit
					label="Continue"
					isPending={form.state.isSubmitting}
					variant="primary"
					className="w-full"
				/>
			</Form>

			<FieldSeparator>or</FieldSeparator>

			<OAuthButtons />
		</AuthCard>
	);
}
