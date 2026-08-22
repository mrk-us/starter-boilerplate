import { Textarea } from "@repo/ui/components/textarea";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

export function FormTextarea(props: FormControlProps) {
	const field = useFieldContext<string>();
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	return (
		<FormBase {...props}>
			<Textarea
				id={field.name}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				aria-invalid={isInvalid}
				aria-describedby={`${field.name}-error`}
			/>
		</FormBase>
	);
}
