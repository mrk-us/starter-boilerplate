"use client";

import { verifyEmailSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { FormErrorContent } from "@repo/ui/components/form/form-errors";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/features/auth/components";
import {
  useResendVerificationEmail,
  useVerifyEmail,
} from "@/features/auth/hooks";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const authId = searchParams.get("authId");
  const token = searchParams.get("token") ?? "";

  if (!authId) {
    console.error("Invalid verification link (no authId)");
  }

  const [resendError, setResendError] = useState<string | undefined>();
  const [resendSent, setResendSent] = useState(false);
  const { verifyEmail } = useVerifyEmail();

  const form = useAppForm({
    defaultValues: {
      authId: authId ?? "",
      code: "",
    },
    validators: {
      onSubmit: verifyEmailSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          if (!authId) {
            console.error("Unable to process verification (no authId)");
            return;
          }
          await verifyEmail(value);
        } catch (error) {
          throw getErrorMessage(error);
        }
      },
    },
  });

  const { resendVerificationEmail } = useResendVerificationEmail();

  async function handleResendVerificationEmail() {
    if (!authId) {
      console.error("Unable to resend verification email (no authId)");
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
