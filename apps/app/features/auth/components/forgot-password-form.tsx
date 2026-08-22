"use client";

import { forgotPasswordSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import Link from "next/link";
import type { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import { useForgotPassword } from "@/features/auth/hooks";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { forgotPassword, isSuccess } = useForgotPassword();

  const form = useAppForm({
    defaultValues: {
      email: "",
    } satisfies FormData as FormData,
    validators: {
      onSubmit: forgotPasswordSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await forgotPassword(value);
        } catch (error) {
          throw getErrorMessage(error);
        }
      },
    },
  });

  return (
    <AuthCard
      description="Enter your email address and we'll send you a link to reset your password"
      footer={
        <p className="w-full text-center text-muted-foreground text-xs">
          Remember your password?{" "}
          <Link
            className="text-foreground underline underline-offset-4 hover:text-primary"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      }
      title="Reset password"
    >
      <Form form={form}>
        <FieldGroup>
          {isSuccess && (
            <div className="relative flex flex-row gap-3 rounded-lg bg-positive/7.5 py-2 pr-3 pl-2 font-medium text-positive text-xs">
              <div className="w-1 shrink-0 self-stretch rounded-full bg-positive" />
              Check your email for a password reset link.
            </div>
          )}

          <form.AppField name="email">
            {(field) => (
              <field.Input
                autoCapitalize="off"
                autoComplete="email"
                autoFocus
                label="Email"
                placeholder="you@example.com"
                type="email"
              />
            )}
          </form.AppField>

          <form.Errors />

          <FormSubmit
            hasChanged={(values) => values.email !== ""}
            isPending={form.state.isSubmitting}
            label="Send reset link"
          />
        </FieldGroup>
      </Form>
    </AuthCard>
  );
}
