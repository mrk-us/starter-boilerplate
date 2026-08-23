import { useClerk, useSignUp } from "@clerk/tanstack-react-start";
import { verifyEmailSchema } from "@repo/backend/convex/auth/validation";
import { tryCatch } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { AuthCard, ResendCodeButton } from "@/features/auth/components";
import { useVerifyEmail } from "@/features/auth/hooks";
import { SectionSpinner } from "@/features/shared/components";

type FormData = z.infer<typeof verifyEmailSchema>;

export function VerifyEmailForm() {
  const { loaded } = useClerk();
  const { signUp } = useSignUp();
  const { resendCode, verifyEmail } = useVerifyEmail();

  const form = useAppForm({
    defaultValues: {
      code: "",
    } satisfies FormData as FormData,
    validators: {
      onSubmit: verifyEmailSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await tryCatch(verifyEmail(value));

        if (error) {
          throw error.message;
        }
      },
    },
  });

  if (!loaded) {
    return <SectionSpinner />;
  }

  // The sign-up attempt lives on the Clerk client, so it is lost if the browser
  // reaches this page without having started one.
  if (!signUp.emailAddress) {
    return (
      <AuthCard title="Nothing to verify">
        <p className="text-center text-muted-foreground text-xs">
          This verification step has expired. Please{" "}
          <Link
            className="text-foreground underline underline-offset-4 hover:text-primary"
            to="/sign-up"
          >
            create your account again
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      description={`Enter the 6-digit code sent to ${signUp.emailAddress}`}
      title="Verify your email"
    >
      <Form form={form}>
        <FieldGroup>
          <form.AppField name="code">
            {(field) => (
              <field.Input
                autoComplete="one-time-code"
                autoFocus
                hideLabel
                inputMode="numeric"
                label="Code"
                placeholder="123456"
              />
            )}
          </form.AppField>
        </FieldGroup>

        <form.Errors />

        <FormSubmit
          className="w-full"
          hasChanged={(values) => values.code !== ""}
          isPending={form.state.isSubmitting}
          label="Verify email"
        />
      </Form>

      <ResendCodeButton resend={resendCode} />
    </AuthCard>
  );
}
