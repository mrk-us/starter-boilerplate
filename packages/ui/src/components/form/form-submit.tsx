import { Button } from "@repo/ui/components/button";
import { useFormContext } from "./hooks";

export type FormSubmitProps = {
  label: string;
  submittingLabel?: string;
  isPending?: boolean;
  hasChanged?: (values: Record<string, unknown>) => boolean;
} & Omit<React.ComponentProps<typeof Button>, "type" | "disabled" | "children">;

export function FormSubmit({
  label,
  isPending = false,
  hasChanged,
  ...buttonProps
}: FormSubmitProps) {
  const form = useFormContext();

  const formApi = form as {
    Subscribe: <TSelected = unknown>(props: {
      selector?: (state: {
        isSubmitting: boolean;
        canSubmit: boolean;
        values: unknown;
        [key: string]: unknown;
      }) => TSelected;
      children: (selectedState: TSelected) => React.ReactNode;
    }) => React.ReactNode;
  };

  const { Subscribe } = formApi;

  return (
    <Subscribe
      selector={(state: {
        isSubmitting: boolean;
        canSubmit: boolean;
        values: unknown;
        [key: string]: unknown;
      }) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
        values: state.values as Record<string, unknown>,
      })}
    >
      {({
        isSubmitting,
        canSubmit,
        values,
      }: {
        isSubmitting: boolean;
        canSubmit: boolean;
        values: Record<string, unknown>;
      }) => {
        const hasChangedValue = hasChanged ? hasChanged(values) : true;

        const disabled =
          isPending ||
          isSubmitting ||
          !canSubmit ||
          (hasChanged !== undefined && !hasChangedValue);

        return (
          <Button
            disabled={disabled}
            pending={isSubmitting}
            type="submit"
            {...buttonProps}
          >
            {label}
          </Button>
        );
      }}
    </Subscribe>
  );
}
