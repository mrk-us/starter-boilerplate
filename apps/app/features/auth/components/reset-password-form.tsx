"use client";

import { resetPasswordSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import { useResetPassword } from "@/features/auth/hooks";

type FormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const { resetPassword } = useResetPassword();

	const form = useAppForm({
		defaultValues: {
			token: token ?? "",
			password: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: resetPasswordSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await resetPassword(value);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	if (!token) {
		return (
			<AuthCard title="Invalid reset link">
				<p className="text-xs text-muted-foreground">
					This password reset link is invalid or has expired. Please{" "}
					<Link
						href="/forgot-password"
						className="text-foreground underline underline-offset-4 hover:text-primary"
					>
						request a new one
					</Link>
					.
				</p>
			</AuthCard>
		);
	}

	return (
		<AuthCard
			title="Set new password"
			description="Enter your new password below"
		>
			<Form form={form}>
				<FieldGroup>
					<form.AppField name="password">
						{(field) => (
							<field.Input
								label="New Password"
								type="password"
								autoCapitalize="off"
								autoComplete="new-password"
								autoFocus
								placeholder="••••••••"
							/>
						)}
					</form.AppField>

					<form.Errors />

					<FormSubmit
						label="Reset password"
						isPending={form.state.isSubmitting}
						hasChanged={(values) => values.password !== ""}
					/>
				</FieldGroup>
			</Form>
		</AuthCard>
	);
}
