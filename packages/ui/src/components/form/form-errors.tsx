import { cn } from "@repo/ui/lib/utils";
import { useMemo } from "react";
import { useFormContext } from "./hooks";

interface FormErrorsProps {
  className?: string;
}

interface FormState {
  errorMap: Record<string, unknown>;
}

export function FormErrors({ className }: FormErrorsProps) {
  const form = useFormContext();

  const formApi = form as {
    Subscribe: <TSelected = unknown>(props: {
      selector?: (state: FormState) => TSelected;
      children: (selectedState: TSelected) => React.ReactNode;
    }) => React.ReactNode;
  };

  const { Subscribe } = formApi;

  return (
    <Subscribe selector={(state) => state.errorMap}>
      {(errorMap: Record<string, unknown>) => {
        const { onSubmit: onSubmitError } = errorMap;

        return (
          <FormErrorContent className={className} errors={onSubmitError} />
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
    if (!errors) {
      return null;
    }

    if (typeof errors === "string") {
      return errors;
    }

    if (Array.isArray(errors)) {
      const messages = errors.filter(
        (e): e is string => typeof e === "string" && e.length > 0
      );

      if (messages.length === 0) {
        return null;
      }
      if (messages.length === 1) {
        return messages[0];
      }

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

  if (!content) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex flex-row gap-3 rounded-lg bg-destructive/7.5 py-2 pr-3 pl-2 font-medium text-destructive text-xs",
        className
      )}
    >
      <div className="w-1 shrink-0 self-stretch rounded-full bg-destructive" />
      {content}
    </div>
  );
}
