"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Button, Input, Label } from "@repo/ui/components";
import Link from "next/link";
import { AuthCard } from "./auth-card";

export function ForgotPasswordForm() {
	return (
		<SignIn.Root>
			{/* Step 1: Enter email to request reset */}
			<SignIn.Step name="start">
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
					<div className="flex flex-col gap-4">
						<Clerk.Field name="identifier" className="flex flex-col gap-2">
							<Clerk.Label asChild>
								<Label className="sr-only">Email</Label>
							</Clerk.Label>
							<Clerk.Input asChild>
								<Input
									type="email"
									placeholder="you@example.com"
									autoCapitalize="off"
									autoComplete="email"
									autoFocus
								/>
							</Clerk.Input>
							<Clerk.FieldError className="text-xs text-destructive" />
						</Clerk.Field>

						{/* This triggers the forgot password flow */}
						<SignIn.Action navigate="forgot-password" asChild>
							<Button variant="primary" className="w-full">
								Send reset code
							</Button>
						</SignIn.Action>
					</div>
				</AuthCard>
			</SignIn.Step>

			{/* Step 2: Enter reset code */}
			<SignIn.Step name="forgot-password">
				<AuthCard
					title="Check your email"
					description="We sent a password reset code to your email"
					footer={
						<p className="text-sm text-muted-foreground text-center w-full">
							Didn't receive a code?{" "}
							<SignIn.Action navigate="start" asChild>
								<button
									type="button"
									className="text-foreground underline underline-offset-4 hover:text-primary"
								>
									Try again
								</button>
							</SignIn.Action>
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

			{/* Step 3: Set new password */}
			<SignIn.Step name="reset-password">
				<AuthCard
					title="Set new password"
					description="Enter your new password"
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
		</SignIn.Root>
	);
}
