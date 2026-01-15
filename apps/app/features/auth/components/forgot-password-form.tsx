"use client";

import { forgotPasswordSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import Link from "next/link";
import type { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import { useForgotPassword } from "@/features/auth/hooks";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
	const { forgotPassword, isSuccess } = useForgotPassword();

	const form = useAppForm({
		defaultValues: {
			email: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: forgotPasswordSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await forgotPassword(value);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<AuthCard
			title="Reset password"
			description="Enter your email address and we'll send you a code to reset your password"
			footer={
				<p className="text-sm text-muted-foreground text-center w-full">
					Remember your password?{" "}
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
					{isSuccess && (
						<div className="rounded-md bg-green-500/10 p-3 text-sm text-green-500 dark:text-green-400">
							Check your email for a password reset link.
						</div>
					)}

					<form.AppField name="email">
						{(field) => (
							<field.Input
								label="Email"
								type="email"
								autoCapitalize="off"
								autoComplete="email"
								autoFocus
								placeholder="you@example.com"
							/>
						)}
					</form.AppField>

					<form.Errors />

					<FormSubmit
						label="Send reset code"
						isPending={form.state.isSubmitting}
						hasChanged={(values) => values.email !== ""}
					/>
				</FieldGroup>
			</Form>
		</AuthCard>
	);
}
