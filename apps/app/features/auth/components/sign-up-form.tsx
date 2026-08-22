"use client";

import { signUpSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
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
import { useSignUp } from "@/features/auth/hooks";

type FormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { signUp } = useSignUp();

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    } satisfies FormData as FormData,
    validators: {
      onSubmit: signUpSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await signUp(value);
        } catch (error) {
          throw getErrorMessage(error);
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
