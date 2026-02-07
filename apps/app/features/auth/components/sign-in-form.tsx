"use client";

import {
	checkEmailSchema,
	signInSchema,
} from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import {
	FieldGroup,
	FieldSeparator,
	Form,
	FormSubmit,
	useAppForm,
} from "@repo/ui/components";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import type { z } from "zod";
import { AuthCard, OAuthButtons } from "@/features/auth/components";
import { useCheckEmail, useSignIn } from "@/features/auth/hooks";

type Step = "email" | "password";

function EmailStep({ onSuccess }: { onSuccess: (email: string) => void }) {
	const { checkEmail } = useCheckEmail();

	type EmailFormData = z.infer<typeof checkEmailSchema>;

	const form = useAppForm({
		defaultValues: {
			email: "",
		} satisfies EmailFormData as EmailFormData,
		validators: {
			onSubmit: checkEmailSchema,
			onSubmitAsync: async ({ value }) => {
				const { error } = await tryCatch(checkEmail({ email: value.email }));

				if (error) {
					throw getErrorMessage(error);
				}

				onSuccess(value.email);
			},
		},
	});

	return (
		<Form form={form}>
			<FieldGroup>
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
			</FieldGroup>

			<form.Errors />

			<FormSubmit
				label="Continue with email"
				isPending={form.state.isSubmitting}
				className="w-full"
			/>
		</Form>
	);
}

function PasswordStep({
	email,
	onReset,
}: {
	email: string;
	onReset: () => void;
}) {
	const { signIn } = useSignIn();

	type PasswordFormData = z.infer<typeof signInSchema>;

	const form = useAppForm({
		defaultValues: {
			email,
			password: "",
		} satisfies PasswordFormData as PasswordFormData,
		validators: {
			onSubmit: signInSchema,
			onSubmitAsync: async ({ value }) => {
				const { error } = await tryCatch(signIn(value));

				if (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<Form form={form}>
			<FieldGroup className="gap-2">
				<div className="relative">
					<Input
						value={email}
						disabled
						type="email"
						autoComplete="username"
						className="pr-8 disabled:opacity-100"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="group absolute right-1 top-1/2 -translate-y-1/2 size-6"
						onClick={onReset}
						aria-label="Change email"
					>
						<IconX className="size-3 stroke-3 group-hover:stroke-primary stroke-muted-foreground transition-colors" />
					</Button>
				</div>

				<form.AppField name="password">
					{(field) => (
						<div className="flex flex-col relative items-end justify-baseline gap-1">
							<field.Input
								hideLabel
								label="Password"
								placeholder="Your password"
								type="password"
								autoCapitalize="off"
								autoComplete="current-password"
								autoFocus
							/>
							<Link
								href="/forgot-password"
								className="text-muted-foreground hover:underline hover:underline-offset-2"
							>
								Forgot password?
							</Link>
						</div>
					)}
				</form.AppField>
			</FieldGroup>

			<form.Errors />

			<FormSubmit
				label="Sign in"
				isPending={form.state.isSubmitting}
				className="w-full"
			/>
		</Form>
	);
}

export function SignInForm() {
	const [step, setStep] = useState<Step>("email");
	const [email, setEmail] = useState("");

	const handleEmailSuccess = (verifiedEmail: string) => {
		setEmail(verifiedEmail);
		setStep("password");
	};

	const handleReset = () => {
		setEmail("");
		setStep("email");
	};

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
			{step === "email" && <EmailStep onSuccess={handleEmailSuccess} />}

			{step === "password" && (
				<PasswordStep email={email} onReset={handleReset} />
			)}

			<FieldSeparator>or</FieldSeparator>

			<OAuthButtons />
		</AuthCard>
	);
}
