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
		Input: FormInput,
		Textarea: FormTextarea,
		Select: FormSelect,
		Checkbox: FormCheckbox,
	},
	formComponents: {
		Submit: FormSubmit,
		Errors: FormErrors,
	},
	fieldContext,
	formContext,
});

export { useAppForm, useFieldContext, useFormContext };
