"use client";

import { FieldGroup } from "@repo/ui/components/field";
import { Form, FormSubmit } from "@repo/ui/components/form";
import { useAppForm } from "@repo/ui/components/form/hooks";
import { useSearchParams } from "next/navigation";
import { getErrorMessage } from "@/features/shared/utils";
import { useResendVerificationEmail, useVerifyEmail } from "../hooks";
import { verifyEmailSchema } from "../utils";
import { AuthCard } from "./auth-card";

export function VerifyEmailForm() {
	const searchParams = useSearchParams();
	const authId = searchParams.get("authId");

	if (!authId) {
		console.error("Invalid verification link (no authId)");
	}

	const { verifyEmail } = useVerifyEmail();

	const form = useAppForm({
		defaultValues: {
			authId: authId ?? "",
			code: "",
		},
		validators: {
			onSubmit: verifyEmailSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					if (!authId) {
						console.error("Unable to process verification (no authId)");
						return;
					}
					await verifyEmail(value);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	const { resendVerificationEmail } = useResendVerificationEmail();

	async function handleResendVerificationEmail() {
		if (!authId) {
			console.error("Unable to resend verification email (no authId)");
			return;
		}

		try {
			const res = await resendVerificationEmail({ authId });

			if (res.success) {
				// TODO: Handle resend timer
			}

			return res;
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
						{(field) => <field.Input label="Code" />}
					</form.AppField>

					<form.Errors />

					<FormSubmit
						label="Verify email"
						isPending={form.state.isSubmitting}
						hasChanged={(values) => values.code !== ""}
					/>
				</FieldGroup>
			</Form>

			<button type="button" onClick={handleResendVerificationEmail}>
				Resend verification email
			</button>
		</AuthCard>
	);
}
