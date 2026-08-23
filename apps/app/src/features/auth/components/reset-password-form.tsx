import { useClerk, useSignIn } from "@clerk/tanstack-react-start";
import { resetPasswordSchema } from "@repo/backend/convex/auth/validation";
import { tryCatch } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { AuthCard, ResendCodeButton } from "@/features/auth/components";
import { useResetPassword } from "@/features/auth/hooks";
import { SectionSpinner } from "@/features/shared/components";

type FormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const { loaded } = useClerk();
  const { signIn } = useSignIn();
  const { resendCode, resetPassword } = useResetPassword();

  const form = useAppForm({
    defaultValues: {
      code: "",
      password: "",
    } satisfies FormData as FormData,
    validators: {
      onSubmit: resetPasswordSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await tryCatch(resetPassword(value));

        if (error) {
          throw error.message;
        }
      },
    },
  });

  if (!loaded) {
    return <SectionSpinner />;
  }

  // The sign-in attempt holding the reset lives on the Clerk client, so it is
  // lost if the browser reaches this page without asking for a code first.
  if (!signIn.identifier) {
    return (
      <AuthCard title="Reset request expired">
        <p className="text-center text-muted-foreground text-xs">
          Please{" "}
          <Link
            className="text-foreground underline underline-offset-4 hover:text-primary"
            to="/forgot-password"
          >
            request a new code
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      description={`Enter the 6-digit code sent to ${signIn.identifier} and choose a new password`}
      title="Set new password"
    >
      <Form form={form}>
        <FieldGroup>
          <form.AppField name="code">
            {(field) => (
              <field.Input
                autoComplete="one-time-code"
                autoFocus
                inputMode="numeric"
                label="Code"
                placeholder="123456"
              />
            )}
          </form.AppField>

          <form.AppField name="password">
            {(field) => (
              <field.Input
                autoCapitalize="off"
                autoComplete="new-password"
                label="New password"
                placeholder="••••••••"
                type="password"
              />
            )}
          </form.AppField>

          <form.Errors />

          <FormSubmit
            hasChanged={(values) =>
              values.code !== "" && values.password !== ""
            }
            isPending={form.state.isSubmitting}
            label="Reset password"
          />
        </FieldGroup>
      </Form>

      <ResendCodeButton resend={resendCode} />
    </AuthCard>
  );
}
