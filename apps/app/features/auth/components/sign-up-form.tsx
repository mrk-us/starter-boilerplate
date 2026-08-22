"use client";

import { signUpSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import {
	FieldGroup,
	FieldSeparator,
	Form,
	FormSubmit,
	useAppForm,
} from "@repo/ui/components";
import Link from "next/link";
import type { z } from "zod";
import { AuthCard, OAuthButtons } from "@/features/auth/components";
import { useSignUp } from "@/features/auth/hooks";

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
			title="Create account"
			footer={
				<p className="text-xs text-muted-foreground text-center w-full">
					Already have an account?{" "}
					<Link
						href="/sign-in"
						className="text-foreground hover:underline hover:underline-offset-2"
					>
						Sign in
					</Link>
				</p>
			}
		>
			<Form form={form}>
				<FieldGroup className="gap-2">
					<form.AppField name="email">
						{(field) => (
							<field.Input
								hideLabel
								label="Email"
								placeholder="Enter your email"
								type="email"
								autoCapitalize="off"
								autoComplete="username"
								autoFocus
							/>
						)}
					</form.AppField>

					<form.AppField name="password">
						{(field) => (
							<field.Input
								hideLabel
								label="Password"
								placeholder="Choose a strong password"
								type="password"
								autoCapitalize="off"
								autoComplete="new-password"
							/>
						)}
					</form.AppField>
				</FieldGroup>

				<form.Errors />

				<FormSubmit
					label="Create account"
					isPending={form.state.isSubmitting}
					className="w-full"
				/>
			</Form>

			<FieldSeparator>or</FieldSeparator>

			<OAuthButtons />
		</AuthCard>
	);
}
