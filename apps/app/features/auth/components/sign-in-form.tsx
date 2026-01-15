"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Button, FieldSeparator, Input, Label } from "@repo/ui/components";
import { IconArrowLeft } from "@tabler/icons-react";
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

export function SignInForm() {
	return (
		<SignIn.Root>
			{/* Step 1: Enter email/identifier */}
			<SignIn.Step name="start" className="flex flex-col gap-4">
				<div className="text-lg w-full text-center font-medium">Sign in</div>
				<Clerk.Field name="identifier" className="flex flex-col gap-2">
					<Clerk.Label asChild>
						<Label className="sr-only">Email</Label>
					</Clerk.Label>
					<Clerk.Input asChild>
						<Input
							type="email"
							placeholder="Your email"
							autoCapitalize="off"
							autoComplete="username"
							autoFocus
						/>
					</Clerk.Input>
					<Clerk.FieldError>
						{({ message }) => <FieldError message={message} />}
					</Clerk.FieldError>
				</Clerk.Field>

				<Clerk.GlobalError>
					{({ message }) => <FieldError message={message} />}
				</Clerk.GlobalError>

				<Clerk.Loading>
					{(isLoading) => (
						<SignIn.Action submit asChild>
							<Button
								type="submit"
								variant="primary"
								className="w-full"
								pending={isLoading}
							>
								Continue
							</Button>
						</SignIn.Action>
					)}
				</Clerk.Loading>

				<FieldSeparator>or</FieldSeparator>

				<div className="flex flex-col gap-2">
					<Clerk.Connection name="google" asChild>
						<Button type="button" className="w-full">
							Continue with Google
						</Button>
					</Clerk.Connection>
				</div>
			</SignIn.Step>

			{/* Step 2: Enter password */}
			<SignIn.Step name="verifications" className="flex flex-col gap-4">
				<SignIn.Strategy name="password">
					<SignIn.Action navigate="start" asChild>
						<Button
							type="button"
							size="icon"
							className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
						>
							<IconArrowLeft className="size-4" />
						</Button>
					</SignIn.Action>

					<div className="flex flex-col gap-1 text-center w-full mt-4 mb-6">
						<div className="text-lg font-medium text-white/95">
							Welcome back <SignIn.Salutation />,
						</div>
						<div className="text-xs text-white/66 [&>strong]:text-white/95 [&>strong]:font-medium">
							Enter the password associate with{" "}
							<strong>
								<SignIn.SafeIdentifier />
							</strong>
						</div>
					</div>

					<Clerk.GlobalError>
						{({ message }) => <FieldError message={message} />}
					</Clerk.GlobalError>

					<div className="flex flex-col gap-4">
						<Clerk.Field name="password" className="flex flex-col gap-2">
							<Clerk.Label asChild>
								<Label className="sr-only">Password</Label>
							</Clerk.Label>
							<Clerk.Input asChild>
								<Input
									type="password"
									placeholder="Password"
									autoCapitalize="off"
									autoComplete="current-password"
									autoFocus
								/>
							</Clerk.Input>
							<Clerk.FieldError>
								{({ message }) => <FieldError message={message} />}
							</Clerk.FieldError>
						</Clerk.Field>

						<Clerk.Loading>
							{(isLoading) => (
								<SignIn.Action submit asChild>
									<Button
										type="submit"
										variant="primary"
										className="w-full"
										pending={isLoading}
									>
										Sign in
									</Button>
								</SignIn.Action>
							)}
						</Clerk.Loading>
					</div>
				</SignIn.Strategy>

				{/* Email code verification (for passwordless or MFA) */}
				<SignIn.Strategy name="email_code">
					<AuthCard
						title="Check your email"
						description="We sent a verification code to your email"
					>
						<SignIn.Action navigate="start" asChild>
							<Button
								type="button"
								size="icon-sm"
								className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
							>
								<IconArrowLeft className="size-4" />
							</Button>
						</SignIn.Action>

						<div className="flex flex-col gap-4">
							<Clerk.Field name="code" className="flex flex-col gap-2">
								<Clerk.Label asChild>
									<Label className="sr-only">Verification code</Label>
								</Clerk.Label>
								<Clerk.Input asChild>
									<Input
										placeholder="Enter code"
										autoComplete="one-time-code"
										autoFocus
									/>
								</Clerk.Input>
								<Clerk.FieldError>
									{({ message }) => <FieldError message={message} />}
								</Clerk.FieldError>
							</Clerk.Field>

							<Clerk.Loading>
								{(isLoading) => (
									<SignIn.Action submit asChild>
										<Button
											type="submit"
											variant="primary"
											className="w-full"
											pending={isLoading}
										>
											Verify
										</Button>
									</SignIn.Action>
								)}
							</Clerk.Loading>
						</div>
					</AuthCard>
				</SignIn.Strategy>

				{/* Reset password code (when user forgot password) */}
				<SignIn.Strategy name="reset_password_email_code">
					<AuthCard
						title="Check your email"
						description="We sent a password reset code to your email"
					>
						<div className="flex flex-col gap-4">
							<Clerk.Field name="code" className="flex flex-col gap-2">
								<Clerk.Label asChild>
									<Label className="sr-only">Reset code</Label>
								</Clerk.Label>
								<Clerk.Input asChild>
									<Input
										placeholder="Enter code"
										autoComplete="one-time-code"
										autoFocus
									/>
								</Clerk.Input>
								<Clerk.FieldError>
									{({ message }) => <FieldError message={message} />}
								</Clerk.FieldError>
							</Clerk.Field>

							<Clerk.Loading>
								{(isLoading) => (
									<SignIn.Action submit asChild>
										<Button
											type="submit"
											variant="primary"
											className="w-full"
											pending={isLoading}
										>
											Verify
										</Button>
									</SignIn.Action>
								)}
							</Clerk.Loading>
						</div>
					</AuthCard>
				</SignIn.Strategy>
			</SignIn.Step>

			{/* Step 3: Set new password (after reset code verification) */}
			<SignIn.Step name="reset-password" className="flex flex-col gap-4">
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
							<Clerk.FieldError>
								{({ message }) => <FieldError message={message} />}
							</Clerk.FieldError>
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
							<Clerk.FieldError>
								{({ message }) => <FieldError message={message} />}
							</Clerk.FieldError>
						</Clerk.Field>

						<Clerk.Loading>
							{(isLoading) => (
								<SignIn.Action submit asChild>
									<Button
										type="submit"
										variant="primary"
										className="w-full"
										pending={isLoading}
									>
										Reset password
									</Button>
								</SignIn.Action>
							)}
						</Clerk.Loading>
					</div>
				</AuthCard>
			</SignIn.Step>
		</SignIn.Root>
	);
}
