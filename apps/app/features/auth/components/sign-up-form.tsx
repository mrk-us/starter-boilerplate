"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { Button, FieldSeparator, Input, Label } from "@repo/ui/components";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { AuthCard } from "./auth-card";

function FieldError({ message }: { message: string }) {
	return (
		<div className="relative flex flex-row gap-3 rounded-lg bg-destructive/7.5 pr-3 pl-2 py-2 my-2 font-medium text-xs text-destructive">
			<div className="w-1 shrink-0 self-stretch rounded-full bg-destructive" />
			{message}
		</div>
	);
}

export function SignUpForm() {
	return (
		<SignUp.Root>
			{/* Step 1: Enter email */}
			<SignUp.Step name="start" className="flex flex-col gap-4">
				<AuthCard
					title="Create an account"
					description="Get started with your account"
					footer={
						<p className="text-sm text-muted-foreground text-center w-full">
							Already have an account?{" "}
							<Link
								href="/sign-in"
								className="text-foreground underline underline-offset-4 hover:text-primary"
							>
								Sign in
							</Link>
						</p>
					}
				>
					<Clerk.GlobalError>
						{({ message }) => <FieldError message={message} />}
					</Clerk.GlobalError>

					<div className="flex flex-col gap-4">
						<Clerk.Field name="emailAddress" className="flex flex-col gap-2">
							<Clerk.Label asChild>
								<Label className="sr-only">Email</Label>
							</Clerk.Label>
							<Clerk.Input asChild>
								<Input
									type="email"
									placeholder="Your email"
									autoCapitalize="off"
									autoComplete="email"
									autoFocus
								/>
							</Clerk.Input>
							<Clerk.FieldError>
								{({ message }) => <FieldError message={message} />}
							</Clerk.FieldError>
						</Clerk.Field>

						<Clerk.Field name="password" className="flex flex-col gap-2">
							<Clerk.Label asChild>
								<Label className="sr-only">Password</Label>
							</Clerk.Label>
							<Clerk.Input asChild>
								<Input
									type="password"
									placeholder="Create a password"
									autoCapitalize="off"
									autoComplete="new-password"
								/>
							</Clerk.Input>
							<Clerk.FieldError>
								{({ message }) => <FieldError message={message} />}
							</Clerk.FieldError>
						</Clerk.Field>

						<SignUp.Captcha />

						<SignUp.Action submit asChild>
							<Button type="submit" variant="primary" className="w-full">
								<Clerk.Loading>
									{(isLoading) =>
										isLoading ? "Creating account..." : "Create account"
									}
								</Clerk.Loading>
							</Button>
						</SignUp.Action>
					</div>

					<FieldSeparator className="py-4">or</FieldSeparator>

					<div className="flex flex-col gap-2">
						<Clerk.Connection name="google" asChild>
							<Button className="w-full">Continue with Google</Button>
						</Clerk.Connection>
					</div>
				</AuthCard>
			</SignUp.Step>

			{/* Step 2: Verify email */}
			<SignUp.Step name="verifications" className="flex flex-col gap-4">
				<SignUp.Strategy name="email_code">
					<AuthCard
						title="Verify your email"
						description="We sent a verification code to your email"
					>
						<SignUp.Action navigate="start" asChild>
							<button
								type="button"
								className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
							>
								<ChevronLeftIcon className="size-4" />
								Back
							</button>
						</SignUp.Action>

						<Clerk.GlobalError>
							{({ message }) => <FieldError message={message} />}
						</Clerk.GlobalError>

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
								<Clerk.FieldError>
									{({ message }) => <FieldError message={message} />}
								</Clerk.FieldError>
							</Clerk.Field>

							<SignUp.Action submit asChild>
								<Button type="submit" variant="primary" className="w-full">
									<Clerk.Loading>
										{(isLoading) =>
											isLoading ? "Verifying..." : "Verify email"
										}
									</Clerk.Loading>
								</Button>
							</SignUp.Action>

							<SignUp.Action resend asChild>
								<Button type="button" className="w-full">
									Resend code
								</Button>
							</SignUp.Action>
						</div>
					</AuthCard>
				</SignUp.Strategy>
			</SignUp.Step>
		</SignUp.Root>
	);
}
