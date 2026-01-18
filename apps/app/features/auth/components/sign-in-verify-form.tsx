"use client";

import { authSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import {
	Button,
	FieldGroup,
	Form,
	FormSubmit,
	useAppForm,
} from "@repo/ui/components";
import { IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import { useSignInVerify } from "@/features/auth/hooks";

const signInVerifySchema = z.object({
	code: authSchema.shape.verificationCode,
});

type FormData = z.infer<typeof signInVerifySchema>;

export function SignInVerifyForm() {
	const router = useRouter();
	const { verify, email, resendCode, isResending, resendSuccess } =
		useSignInVerify();

	const form = useAppForm({
		defaultValues: {
			code: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: signInVerifySchema,
			onSubmitAsync: async ({ value }) => {
				const { error } = await tryCatch(verify(value));

				if (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	const handleResendCode = async () => {
		await resendCode();
	};

	return (
		<AuthCard
			title="Check your email"
			description={`We sent a verification code to ${email ?? "your email"}`}
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
				<FieldGroup>
					{/* Email Preview */}
					<div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl corner-superellipse/1.2 shadow-glass-secondary bg-white/5">
						<div className="flex-1 text-xs text-white/90 truncate font-medium">
							{email}
						</div>
						<button
							type="button"
							onClick={() => router.push("/sign-in")}
							className="hover:text-white/90 text-muted-foreground transition-colors size-6 flex items-center justify-center -mr-1"
						>
							<IconX className="size-3.5 stroke-3" />
						</button>
					</div>

					<form.AppField name="code">
						{(field) => (
							<field.Input
								hideLabel
								label="Verification code"
								placeholder="Enter 6-digit code"
								autoComplete="one-time-code"
								autoFocus
							/>
						)}
					</form.AppField>
				</FieldGroup>

				<form.Errors />

				<FormSubmit
					variant="primary"
					label="Verify"
					isPending={form.state.isSubmitting}
					className="mt-6 w-full"
				/>
			</Form>

			<Button
				type="button"
				variant="ghost"
				onClick={handleResendCode}
				disabled={isResending}
				className="w-full"
			>
				{resendSuccess
					? "Code sent!"
					: isResending
						? "Sending..."
						: "Resend code"}
			</Button>
		</AuthCard>
	);
}
