"use client";

import { resetPasswordSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { z } from "zod";
import { AuthCard } from "@/features/auth/components";
import { useResetPassword } from "@/features/auth/hooks";

type FormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { resetPassword } = useResetPassword();

  const form = useAppForm({
    defaultValues: {
      password: "",
      token: token ?? "",
    } satisfies FormData as FormData,
    validators: {
      onSubmit: resetPasswordSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await resetPassword(value);
        } catch (error) {
          throw getErrorMessage(error);
        }
      },
    },
  });

  if (!token) {
    return (
      <AuthCard title="Invalid reset link">
        <p className="text-muted-foreground text-xs">
          This password reset link is invalid or has expired. Please{" "}
          <Link
            className="text-foreground underline underline-offset-4 hover:text-primary"
            href="/forgot-password"
          >
            request a new one
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      description="Enter your new password below"
      title="Set new password"
    >
      <Form form={form}>
        <FieldGroup>
          <form.AppField name="password">
            {(field) => (
              <field.Input
                autoCapitalize="off"
                autoComplete="new-password"
                autoFocus
                label="New Password"
                placeholder="••••••••"
                type="password"
              />
            )}
          </form.AppField>

          <form.Errors />

          <FormSubmit
            hasChanged={(values) => values.password !== ""}
            isPending={form.state.isSubmitting}
            label="Reset password"
          />
        </FieldGroup>
      </Form>
    </AuthCard>
  );
}
