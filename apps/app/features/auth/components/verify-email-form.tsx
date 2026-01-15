"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { Button, Input, Label } from "@repo/ui/components";
import { AuthCard } from "./auth-card";

export function VerifyEmailForm() {
	return (
		<SignUp.Root>
			{/* Show verification step - user should have pending signup */}
			<SignUp.Step name="verifications">
				<SignUp.Strategy name="email_code">
					<AuthCard
						title="Verify your email"
						description="Enter the 6-digit code sent to your email address"
					>
						<div className="flex flex-col gap-4">
							<Clerk.Field name="code" className="flex flex-col gap-2">
								<Clerk.Label asChild>
									<Label className="sr-only">Verification code</Label>
								</Clerk.Label>
								<Clerk.Input asChild>
									<Input
										placeholder="Enter verification code"
										autoComplete="one-time-code"
										autoFocus
									/>
								</Clerk.Input>
								<Clerk.FieldError className="text-xs text-destructive" />
							</Clerk.Field>

							<SignUp.Action submit asChild>
								<Button variant="primary" className="w-full">
									Verify email
								</Button>
							</SignUp.Action>

							<SignUp.Action resend asChild>
								<Button type="button" className="w-full">
									Resend verification email
								</Button>
							</SignUp.Action>
						</div>
					</AuthCard>
				</SignUp.Strategy>
			</SignUp.Step>

			{/* Fallback: if no pending signup, show start step */}
			<SignUp.Step name="start">
				<AuthCard
					title="Verify your email"
					description="No pending verification found. Please sign up first."
				>
					<Button
						variant="primary"
						className="w-full"
						onClick={() => (window.location.href = "/sign-up")}
					>
						Go to sign up
					</Button>
				</AuthCard>
			</SignUp.Step>
		</SignUp.Root>
	);
}
