"use client";

import { signInSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import Link from "next/link";
import type { z } from "zod";
import { AuthCard, OAuthButtons } from "@/features/auth/components";
import { useSignIn } from "@/features/auth/hooks";

type FormData = z.infer<typeof signInSchema>;

export function SignInForm() {
	const { signIn } = useSignIn();

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: signInSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await signIn(value);
				} catch (error) {
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
			<Form form={form}>
				<FieldGroup className="gap-1">
					<form.AppField name="email">
						{(field) => (
							<field.Input
								hideLabel
								label="Email"
								placeholder="Your email"
								type="email"
								autoCapitalize="off"
								autoComplete="username"
								autoFocus
							/>
						)}
					</form.AppField>

					<form.AppField name="password">
						{(field) => (
							<>
								<div className="flex flex-col relative items-end justify-baseline gap-1">
									<field.Input
										hideLabel
										label="Password"
										placeholder="Your password"
										type="password"
										autoCapitalize="off"
										autoComplete="current-password"
									/>
									<Link
										href="/forgot-password"
										className="text-muted-foreground hover:underline hover:underline-offset-2"
									>
										Forgot password?
									</Link>
								</div>
							</>
						)}
					</form.AppField>
				</FieldGroup>

				<form.Errors />

				<FormSubmit
					label="Sign in"
					isPending={form.state.isSubmitting}
					hasChanged={(values) => values.email !== "" || values.password !== ""}
					className="mt-6 w-full"
				/>
			</Form>

			<OAuthButtons />
		</AuthCard>
	);
}
