import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { FormCheckbox } from "./form-checkbox";
import { FormErrors } from "./form-errors";
import { FormInput } from "./form-input";
import { FormSelect } from "./form-select";
import { FormSubmit } from "./form-submit";
import { FormTextarea } from "./form-textarea";

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const { useAppForm: useBaseAppForm } = createFormHook({
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

// A failed submit leaves an error that would otherwise disable the button until
// a field changes, which blocks retrying the same value. Every submit still runs
// validation first.
const useAppForm: typeof useBaseAppForm = (props) =>
  useBaseAppForm({ canSubmitWhenInvalid: true, ...props });

export { useAppForm, useFieldContext, useFormContext };
