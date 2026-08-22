"use client";

import { signUpSchema } from "@repo/backend/convex/auth/validation";
import { tryCatch } from "@repo/shared/utils";
import {
  FieldGroup,
  FieldSeparator,
  Form,
  FormSubmit,
  useAppForm,
} from "@repo/ui/components";
import Link from "next/link";
import type { z } from "zod";
import { AuthCard, OAuthButtons } from "@/features/auth/components";
import { useSignUpWithPassword } from "@/features/auth/hooks";

type FormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { signUpWithPassword } = useSignUpWithPassword();

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    } satisfies FormData as FormData,
    validators: {
      onSubmit: signUpSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await tryCatch(signUpWithPassword(value));

        if (error) {
          throw error.message;
        }
      },
    },
  });

  return (
    <AuthCard
      footer={
        <p className="w-full text-center text-muted-foreground text-xs">
          Already have an account?{" "}
          <Link
            className="text-foreground hover:underline hover:underline-offset-2"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      }
      title="Create account"
    >
      <Form form={form}>
        <FieldGroup className="gap-2">
          <form.AppField name="email">
            {(field) => (
              <field.Input
                autoCapitalize="off"
                autoComplete="username"
                autoFocus
                hideLabel
                label="Email"
                placeholder="Enter your email"
                type="email"
              />
            )}
          </form.AppField>

          <form.AppField name="password">
            {(field) => (
              <field.Input
                autoCapitalize="off"
                autoComplete="new-password"
                hideLabel
                label="Password"
                placeholder="Choose a strong password"
                type="password"
              />
            )}
          </form.AppField>
        </FieldGroup>

        <form.Errors />

        {/* Clerk renders its bot-protection challenge here; without this node it
            falls back to a modal that steals focus from the form. */}
        <div id="clerk-captcha" />

        <FormSubmit
          className="w-full"
          isPending={form.state.isSubmitting}
          label="Create account"
        />
      </Form>

      <FieldSeparator>or</FieldSeparator>

      <OAuthButtons />
    </AuthCard>
  );
}
