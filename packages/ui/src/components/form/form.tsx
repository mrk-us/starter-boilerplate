import type { FormHTMLAttributes, ReactNode } from "react";

type FormWithAppForm = {
	AppForm: React.ComponentType<{ children?: ReactNode }>;
	handleSubmit: () => void;
};

export type FormProps = {
	children: ReactNode;
	form: FormWithAppForm;
	onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit">;

export function Form({ children, form, onSubmit, ...formProps }: FormProps) {
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				if (onSubmit) {
					onSubmit(e);
				} else {
					form.handleSubmit();
				}
			}}
			{...formProps}
			noValidate
			className="space-y-4 w-full"
		>
			<form.AppForm>{children}</form.AppForm>
		</form>
	);
}
