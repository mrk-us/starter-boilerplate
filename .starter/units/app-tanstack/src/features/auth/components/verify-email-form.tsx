import { verifyEmailSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared/utils";
import { FieldGroup, Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { useSearch } from "@tanstack/react-router";
import { AuthCard } from "@/features/auth/components";
import {
  useResendVerificationEmail,
  useVerifyEmail,
} from "@/features/auth/hooks";

export function VerifyEmailForm() {
  const { authId } = useSearch({ from: "/_auth/verify-email" });

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

    try {
      await resendVerificationEmail({ authId });
    } catch (error) {
      console.error(getErrorMessage(error));
    }
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
    </AuthCard>
  );
}
