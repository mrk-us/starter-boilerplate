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
              autoCapitalize="off"
              autoComplete="username"
              autoFocus
              hideLabel
              label="Email"
              placeholder="Your email"
              type="email"
            />
          )}
        </form.AppField>
      </FieldGroup>

      <form.Errors />

      <FormSubmit
        className="w-full"
        isPending={form.state.isSubmitting}
        label="Continue with email"
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
            autoComplete="username"
            className="pr-8 disabled:opacity-100"
            disabled
            type="email"
            value={email}
          />
          <Button
            aria-label="Change email"
            className="group absolute top-1/2 right-1 size-6 -translate-y-1/2"
            onClick={onReset}
            size="icon"
            type="button"
            variant="ghost"
          >
            <IconX className="size-3 stroke-3 stroke-muted-foreground transition-colors group-hover:stroke-primary" />
          </Button>
        </div>

        <form.AppField name="password">
          {(field) => (
            <div className="justify-baseline relative flex flex-col items-end gap-1">
              <field.Input
                autoCapitalize="off"
                autoComplete="current-password"
                autoFocus
                hideLabel
                label="Password"
                placeholder="Your password"
                type="password"
              />
              <Link
                className="text-muted-foreground hover:underline hover:underline-offset-2"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </form.AppField>
      </FieldGroup>

      <form.Errors />

      <FormSubmit
        className="w-full"
        isPending={form.state.isSubmitting}
        label="Sign in"
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
      footer={
        <p className="w-full text-center text-muted-foreground text-xs">
          Don't have an account?{" "}
          <Link
            className="text-foreground hover:underline hover:underline-offset-2"
            href="/sign-up"
          >
            Sign up
          </Link>
        </p>
      }
      title="Sign in"
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
