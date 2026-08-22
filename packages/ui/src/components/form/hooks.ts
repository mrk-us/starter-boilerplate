import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { FormCheckbox } from "./form-checkbox";
import { FormErrors } from "./form-errors";
import { FormInput } from "./form-input";
import { FormSelect } from "./form-select";
import { FormSubmit } from "./form-submit";
import { FormTextarea } from "./form-textarea";

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    Checkbox: FormCheckbox,
    Input: FormInput,
    Select: FormSelect,
    Textarea: FormTextarea,
  },
  fieldContext,
  formComponents: {
    Errors: FormErrors,
    Submit: FormSubmit,
  },
  formContext,
});

export { useAppForm, useFieldContext, useFormContext };
