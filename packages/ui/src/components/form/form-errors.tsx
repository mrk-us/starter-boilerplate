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
			{(errorMap: Record<string, unknown>) => {
				const onSubmitError = errorMap?.onSubmit;
				const errorMessage = typeof onSubmitError === "string" && onSubmitError;

				if (!errorMessage) return null;

				return (
					<div className="relative flex flex-row gap-3 rounded-lg bg-destructive/7.5 pr-3 pl-2 py-2 my-2 font-medium text-xs text-destructive">
						<div className="w-1 shrink-0 self-stretch rounded-full bg-destructive" />
						{errorMessage}
					</div>
				);
			}}
		</Subscribe>
	);
}
