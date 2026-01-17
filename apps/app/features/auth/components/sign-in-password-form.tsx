"use client";

import { usePasswordSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import { useSignInPassword } from "@/features/auth/hooks";

const signInPasswordSchema = z.object({
	password: usePasswordSchema.shape.password,
});

type FormData = z.infer<typeof signInPasswordSchema>;

export function SignInPasswordForm() {
	const router = useRouter();
	const { signInWithPassword, email } = useSignInPassword();

	const form = useAppForm({
		defaultValues: {
			password: "",
		} satisfies FormData as FormData,
		validators: {
			onSubmit: signInPasswordSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					await signInWithPassword(value);
				} catch (error) {
					throw getErrorMessage(error);
				}
			},
		},
	});

	return (
		<AuthCard
			title="Enter your password"
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
					<div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl corner-superellipse/1.2 shadow-glass-secondary bg-white/5">
						<div className="flex-1 text-xs text-white/90 truncate font-medium">
							{email}{" "}
						</div>
						<button
							type="button"
							onClick={() => router.push("/sign-in")}
							className="hover:text-white/90 text-muted-foreground transition-colors size-6 flex items-center justify-center -mr-1"
						>
							<IconX className="size-3.5 stroke-3" />
						</button>
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
					variant="primary"
					className="mt-6 w-full"
				/>
			</Form>
		</AuthCard>
	);
}
