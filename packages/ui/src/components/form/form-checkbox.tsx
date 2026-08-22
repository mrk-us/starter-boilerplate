import { Checkbox } from "@repo/ui/components/checkbox";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

export function FormCheckbox(props: FormControlProps) {
  const field = useFieldContext<boolean>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props} controlFirst horizontal>
      <Checkbox
        aria-describedby={`${field.name}-error`}
        aria-invalid={isInvalid}
        checked={field.state.value}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onCheckedChange={(e) => field.handleChange(e === true)}
      />
    </FormBase>
  );
}
