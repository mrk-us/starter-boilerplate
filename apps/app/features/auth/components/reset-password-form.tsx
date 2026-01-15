"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Button, Input, Label } from "@repo/ui/components";
import Link from "next/link";
import { AuthCard } from "./auth-card";

export function ResetPasswordForm() {
	return (
		<SignIn.Root>
			{/* Step: Enter reset code (if user has pending reset) */}
			<SignIn.Step name="forgot-password">
				<AuthCard
					title="Enter reset code"
					description="Enter the 6-digit code sent to your email"
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
					<div className="flex flex-col gap-4">
						<SignIn.SupportedStrategy name="reset_password_email_code">
							<Clerk.Field name="code" className="flex flex-col gap-2">
								<Clerk.Label asChild>
									<Label className="sr-only">Reset code</Label>
								</Clerk.Label>
								<Clerk.Input asChild>
									<Input
										placeholder="Enter reset code"
										autoComplete="one-time-code"
										autoFocus
									/>
								</Clerk.Input>
								<Clerk.FieldError className="text-xs text-destructive" />
							</Clerk.Field>

							<SignIn.Action submit asChild>
								<Button variant="primary" className="w-full">
									Verify code
								</Button>
							</SignIn.Action>
						</SignIn.SupportedStrategy>
					</div>
				</AuthCard>
			</SignIn.Step>

			{/* Step: Set new password */}
			<SignIn.Step name="reset-password">
				<AuthCard
					title="Set new password"
					description="Enter your new password below"
				>
					<div className="flex flex-col gap-4">
						<Clerk.Field name="password" className="flex flex-col gap-2">
							<Clerk.Label asChild>
								<Label className="sr-only">New password</Label>
							</Clerk.Label>
							<Clerk.Input asChild>
								<Input
									type="password"
									placeholder="New password"
									autoComplete="new-password"
									autoFocus
								/>
							</Clerk.Input>
							<Clerk.FieldError className="text-xs text-destructive" />
						</Clerk.Field>

						<Clerk.Field name="confirmPassword" className="flex flex-col gap-2">
							<Clerk.Label asChild>
								<Label className="sr-only">Confirm password</Label>
							</Clerk.Label>
							<Clerk.Input asChild>
								<Input
									type="password"
									placeholder="Confirm password"
									autoComplete="new-password"
								/>
							</Clerk.Input>
							<Clerk.FieldError className="text-xs text-destructive" />
						</Clerk.Field>

						<SignIn.Action submit asChild>
							<Button variant="primary" className="w-full">
								Reset password
							</Button>
						</SignIn.Action>
					</div>
				</AuthCard>
			</SignIn.Step>

			{/* Fallback: if no pending reset, redirect to forgot-password */}
			<SignIn.Step name="start">
				<AuthCard
					title="Reset password"
					description="No pending password reset found."
				>
					<Button
						variant="primary"
						className="w-full"
						onClick={() => (window.location.href = "/forgot-password")}
					>
						Request password reset
					</Button>
				</AuthCard>
			</SignIn.Step>
		</SignIn.Root>
	);
}
