"use client";

import { createPasswordSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import { useResetPassword, useVerifyResetCode } from "@/features/auth/hooks";

const codeSchema = z.object({
	code: z.string().length(6, "Code must be 6 digits"),
});

const passwordSchema = z.object({
	password: createPasswordSchema.shape.password,
});

type CodeFormData = z.infer<typeof codeSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ResetPasswordForm() {
	const [step, setStep] = useState<"code" | "password">("code");
	const { verifyCode } = useVerifyResetCode();
	const { resetPassword } = useResetPassword();

	const codeForm = useAppForm({
		defaultValues: {
			code: "",
		} satisfies CodeFormData as CodeFormData,
		validators: {
			onSubmit: codeSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await verifyCode(value);
					setStep("password");
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	const passwordForm = useAppForm({
		defaultValues: {
			password: "",
		} satisfies PasswordFormData as PasswordFormData,
		validators: {
			onSubmit: passwordSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await resetPassword(value);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	if (step === "code") {
		return (
			<AuthCard
				title="Enter reset code"
				description="Enter the 6-digit code sent to your email address"
				footer={
					<p className="text-sm text-muted-foreground text-center w-full">
						Didn't receive a code?{" "}
						<Link
							href="/forgot-password"
							className="text-foreground underline underline-offset-4 hover:text-primary"
						>
							Try again
						</Link>
					</p>
				}
			>
				<Form form={codeForm}>
					<FieldGroup>
						<codeForm.AppField name="code">
							{(field) => (
								<field.Input
									label="Reset code"
									placeholder="123456"
									autoComplete="one-time-code"
									autoFocus
								/>
							)}
						</codeForm.AppField>

						<codeForm.Errors />

						<FormSubmit
							label="Verify code"
							isPending={codeForm.state.isSubmitting}
							hasChanged={(values) => values.code !== ""}
						/>
					</FieldGroup>
				</Form>
			</AuthCard>
		);
	}

	return (
		<AuthCard
			title="Set new password"
			description="Enter your new password below"
		>
			<Form form={passwordForm}>
				<FieldGroup>
					<passwordForm.AppField name="password">
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
					</passwordForm.AppField>

					<passwordForm.Errors />

					<FormSubmit
						label="Reset password"
						isPending={passwordForm.state.isSubmitting}
						hasChanged={(values) => values.password !== ""}
					/>
				</FieldGroup>
			</Form>
		</AuthCard>
	);
}
