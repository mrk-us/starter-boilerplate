import { useFormContext } from "./hooks";

type FormState = {
	errorMap: Record<string, unknown>;
};

export function FormErrors() {
	const form = useFormContext();

	const formApi = form as {
		Subscribe: <TSelected = unknown>(props: {
			selector?: (state: FormState) => TSelected;
			children: (selectedState: TSelected) => React.ReactNode;
		}) => React.ReactNode;
	};

	const Subscribe = formApi.Subscribe;

	return (
		<Subscribe selector={(state) => state.errorMap}>
			{(errorMap: Record<string, unknown>) =>
				// Return server errors only, ignoring field validation errors
				typeof errorMap?.onSubmit === "string" ? (
					<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{errorMap.onSubmit}
					</div>
				) : null
			}
		</Subscribe>
	);
}
