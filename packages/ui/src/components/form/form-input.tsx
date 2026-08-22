import { Input } from "@repo/ui/components/input";
import type { ComponentProps } from "react";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

type FormInputProps = FormControlProps &
  Omit<
    ComponentProps<typeof Input>,
    | "id"
    | "name"
    | "value"
    | "defaultValue"
    | "onBlur"
    | "onChange"
    | "aria-invalid"
  >;

export function FormInput(props: FormInputProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const { label, hideLabel, description, ...inputProps } = props;

  return (
    <FormBase description={description} hideLabel={hideLabel} label={label}>
      <Input
        {...inputProps}
        aria-describedby={`${field.name}-error`}
        aria-invalid={isInvalid}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        value={field.state.value}
      />
    </FormBase>
  );
}
