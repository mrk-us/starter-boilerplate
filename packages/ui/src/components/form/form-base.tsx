import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@repo/ui/components/field";
import type { ReactNode } from "react";
import { useFieldContext } from "./hooks";

export type FormControlProps = {
	label: string;
	hideLabel?: boolean;
	description?: string;
};

type FormBaseProps = FormControlProps & {
	children: ReactNode;
	horizontal?: boolean;
	controlFirst?: boolean;
};

export function FormBase({
	children,
	label,
	hideLabel,
	description,
	controlFirst,
	horizontal,
}: FormBaseProps) {
	const field = useFieldContext();
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	const labelElement = (
		<>
			<FieldLabel
				htmlFor={field.name}
				className={hideLabel ? "sr-only" : undefined}
			>
				{label}
			</FieldLabel>
			{description && <FieldDescription>{description}</FieldDescription>}
		</>
	);
	const errorElement = isInvalid && (
		<FieldError errors={field.state.meta.errors} />
	);

	return (
		<Field
			data-invalid={isInvalid}
			orientation={horizontal ? "horizontal" : undefined}
		>
			{controlFirst ? (
				<>
					{children}
					<FieldContent>
						{labelElement}
						{errorElement}
					</FieldContent>
				</>
			) : (
				<>
					<FieldContent>{labelElement}</FieldContent>
					{children}
					{errorElement}
				</>
			)}
		</Field>
	);
}
