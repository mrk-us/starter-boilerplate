"use client";

import { userSchema } from "@repo/backend/convex/users/validation";
import { getErrorMessage, tryCatch } from "@repo/shared/utils";
import { Form, FormSubmit, useAppForm } from "@repo/ui/components";
import { z } from "zod";
import { useCompleteSetup } from "@/features/setup/hooks";
import { useCurrentUser } from "@/features/user/hooks";

const nameFormSchema = z.object({
  name: userSchema.shape.name,
});

export function CompleteSetup() {
  const { user } = useCurrentUser();
  const { completeSetup } = useCompleteSetup();

  const form = useAppForm({
    defaultValues: {
      name: user?.name ?? "",
    },
    validators: {
      onSubmit: nameFormSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await tryCatch(async () => {
          await completeSetup(value.name);
        });

        if (error) {
          throw getErrorMessage(error);
        }
      },
    },
  });

  return (
    <Form form={form}>
      <form.AppField name="name">
        {(field) => <field.Input autoFocus label="What should we call you?" />}
      </form.AppField>

      <form.Errors />

      <FormSubmit
        hasChanged={(values) => values.name !== ""}
        isPending={form.state.isSubmitting}
        label="Continue"
      />
    </Form>
  );
}
