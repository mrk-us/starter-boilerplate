import { verifyEmailSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { FormErrorContent } from "@repo/ui/components/form/form-errors";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard } from "@/features/auth/components";
import {
  useResendVerificationEmail,
  useVerifyEmail,
} from "@/features/auth/hooks";

export function VerifyEmailForm() {
  const { authId, token = "" } = useSearch({ from: "/_auth/verify-email" });

  const [resendError, setResendError] = useState<string | undefined>();
  const [resendSent, setResendSent] = useState(false);
  const { verifyEmail } = useVerifyEmail();
  const { resendVerificationEmail } = useResendVerificationEmail();

  const form = useAppForm({
    defaultValues: {
      authId: authId ?? "",
      code: "",
    },
    validators: {
      onSubmit: verifyEmailSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await verifyEmail(value);
        } catch (error) {
          throw getErrorMessage(error);
        }
      },
    },
  });

  async function handleResendVerificationEmail() {
    if (!authId) {
      return;
    }

    setResendError(undefined);
    setResendSent(false);

    const { error } = await tryCatch(
      resendVerificationEmail({ authId, token })
    );

    if (error) {
      setResendError(getErrorMessage(error));
      return;
    }

    setResendSent(true);
  }

  if (!authId) {
    return (
      <AuthCard title="Invalid verification link">
        <p className="text-muted-foreground text-xs">
          This verification link is missing its account reference. Sign up again
          to receive a new one.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      description="Enter the 6-digit code sent to your email address"
      title="Verify your email"
    >
      <Form form={form}>
        <FieldGroup>
          <form.AppField name="code">
            {(field) => <field.Input label="Code" />}
          </form.AppField>

          <form.Errors />

          <FormSubmit
            hasChanged={(values) => values.code !== ""}
            isPending={form.state.isSubmitting}
            label="Verify email"
          />
        </FieldGroup>
      </Form>

      <button onClick={handleResendVerificationEmail} type="button">
        Resend verification email
      </button>

      {resendSent && (
        <p className="text-center text-muted-foreground text-xs" role="status">
          We sent a new code. Check your email.
        </p>
      )}

      <FormErrorContent errors={resendError} />
    </AuthCard>
  );
}
