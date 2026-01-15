"use client";

import { verifyEmailSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import {
	Button,
	FieldGroup,
	Form,
	FormSubmit,
	useAppForm,
} from "@repo/ui/components";
import type { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import {
	useResendVerificationEmail,
	useVerifyEmail,
} from "@/features/auth/hooks";

type FormData = z.infer<typeof verifyEmailSchema>;

export function VerifyEmailForm() {
	const { verifyEmail } = useVerifyEmail();
	const { resendVerificationEmail, isPending: isResending } =
		useResendVerificationEmail();

	const form = useAppForm({
		defaultValues: {
			code: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: verifyEmailSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await verifyEmail(value);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	async function handleResendVerificationEmail() {
		try {
			await resendVerificationEmail();
		} catch (error) {
			console.error(getErrorMessage(error));
		}
	}

	return (
		<AuthCard
			title="Verify your email"
			description="Enter the 6-digit code sent to your email address"
		>
			<Form form={form}>
				<FieldGroup>
					<form.AppField name="code">
						{(field) => (
							<field.Input
								label="Verification code"
								autoComplete="one-time-code"
								autoFocus
							/>
						)}
					</form.AppField>

					<form.Errors />

					<FormSubmit
						label="Verify email"
						isPending={form.state.isSubmitting}
						hasChanged={(values) => values.code !== ""}
					/>
				</FieldGroup>
			</Form>

			<Button
				type="button"
				onClick={handleResendVerificationEmail}
				disabled={isResending}
				className="w-full mt-2"
			>
				{isResending ? "Sending..." : "Resend verification email"}
			</Button>
		</AuthCard>
	);
}
