import { cn } from "@repo/ui/lib/utils";
import { useFormContext } from "./hooks";

type FormErrorsProps = {
	className?: string;
};

type FormState = {
	errorMap: Record<string, unknown>;
};

export function FormErrors({ className }: FormErrorsProps) {
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
					<div
						className={cn(
							"relative flex flex-row gap-3 rounded-lg bg-destructive/7.5 pr-3 pl-2 py-2 font-medium text-xs text-destructive",
							className,
						)}
					>
						<div className="w-1 shrink-0 self-stretch rounded-full bg-destructive" />
						{errorMessage}
					</div>
				);
			}}
		</Subscribe>
	);
}
