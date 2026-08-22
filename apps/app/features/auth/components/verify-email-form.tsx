"use client";

import { verifyEmailSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/features/auth/components";
import {
  useResendVerificationEmail,
  useVerifyEmail,
} from "@/features/auth/hooks";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const authId = searchParams.get("authId");

  if (!authId) {
    console.error("Invalid verification link (no authId)");
  }

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

    try {
      const res = await resendVerificationEmail({ authId });

      if (res.success) {
        // TODO: Handle resend timer
      }

      return res;
    } catch (error) {
      console.error(getErrorMessage(error));
    }
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
    </AuthCard>
  );
}
