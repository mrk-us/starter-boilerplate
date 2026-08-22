import { cn } from "@repo/ui/lib/utils";
import { useMemo } from "react";
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

				return (
					<FormErrorContent errors={onSubmitError} className={className} />
				);
			}}
		</Subscribe>
	);
}

function FormErrorContent({
	errors,
	className,
}: {
	errors: unknown;
	className?: string;
}) {
	const content = useMemo(() => {
		if (!errors) return null;

		if (typeof errors === "string") {
			return errors;
		}

		if (Array.isArray(errors)) {
			const messages = errors.filter(
				(e): e is string => typeof e === "string" && e.length > 0,
			);

			if (messages.length === 0) return null;
			if (messages.length === 1) return messages[0];

			return (
				<ul className="ml-3 flex list-disc flex-col">
					{messages.map((message) => (
						<li key={message}>{message}</li>
					))}
				</ul>
			);
		}

		return null;
	}, [errors]);

	if (!content) return null;

	return (
		<div
			className={cn(
				"relative flex flex-row gap-3 rounded-lg bg-destructive/7.5 pr-3 pl-2 py-2 font-medium text-xs text-destructive",
				className,
			)}
			aria-describedby=""
		>
			<div className="w-1 shrink-0 self-stretch rounded-full bg-destructive" />
			{content}
		</div>
	);
}
