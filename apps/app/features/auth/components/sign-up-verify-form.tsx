"use client";

import { verifyEmailSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
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

export function SignUpVerifyForm() {
	const { verifyEmail } = useVerifyEmail();
	const {
		resendVerificationEmail,
		isPending: isResending,
		isSuccess,
	} = useResendVerificationEmail();

	const form = useAppForm({
		defaultValues: {
			code: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: verifyEmailSchema,
			onSubmitAsync: async ({ value }) => {
				const { error } = await tryCatch(verifyEmail(value));

				if (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	async function handleResendVerificationEmail() {
		const { error } = await tryCatch(resendVerificationEmail());

		if (error) {
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
						variant="primary"
						label="Verify email"
						isPending={form.state.isSubmitting}
					/>
				</FieldGroup>
			</Form>

			<Button
				type="button"
				onClick={handleResendVerificationEmail}
				disabled={isResending || isSuccess}
				pending={isResending}
				className="w-full"
			>
				{isSuccess ? "Code sent" : "Resend code"}
			</Button>
		</AuthCard>
	);
}
