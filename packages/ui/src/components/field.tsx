"use client";

import { Label } from "@repo/ui/components/label";
import { Separator } from "@repo/ui/components/separator";

import { cn } from "@repo/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { useMemo } from "react";
import { useFieldContext } from "./form/hooks";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      data-slot="field-set"
      {...props}
    />
  );
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      className={cn(
        "mb-2 font-medium data-[variant=label]:text-xs/relaxed data-[variant=legend]:text-sm",
        className
      )}
      data-slot="field-legend"
      data-variant={variant}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-4 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      )}
      data-slot="field-group"
      {...props}
    />
  );
}

const fieldVariants = cva(
  "group/field flex w-full gap-0 data-[invalid=true]:text-destructive",
  {
    defaultVariants: {
      orientation: "vertical",
    },
    variants: {
      orientation: {
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "@md/field-group:flex-row flex-col @md/field-group:items-center @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:[&>*]:w-auto [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
      },
    },
  }
);

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      className={cn(fieldVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="field"
      role="group"
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        className
      )}
      data-slot="field-content"
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border has-data-checked:bg-primary/5 group-data-[disabled=true]/field:opacity-50 dark:has-data-checked:bg-primary/10 [&>*]:data-[slot=field]:p-2",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-2 font-medium text-xs/relaxed leading-snug group-data-[disabled=true]/field:opacity-50",
        className
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-left font-normal text-muted-foreground text-xs/relaxed leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "nth-last-2:-mt-1 last:mt-0",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      data-slot="field-description"
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("flex flex-row items-center justify-stretch", className)}
      data-content={!!children}
      data-slot="field-separator"
      {...props}
    >
      <Separator className="w-full flex-1" orientation="horizontal" />
      {children && (
        <span
          className="w-fit px-2 text-muted-foreground text-xs"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
      <Separator className="w-full flex-1" orientation="horizontal" />
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const field = useFieldContext<string>();

  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-3 flex list-disc flex-col">
        {uniqueErrors.map((error) =>
          error?.message ? <li key={error.message}>{error.message}</li> : null
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        "relative mt-2 flex flex-row gap-3 rounded-lg bg-destructive/7.5 py-2 pr-3 pl-2 font-medium text-destructive text-xs",
        className
      )}
      data-slot="field-error"
      id={`${field.name}-error`}
      role="alert"
      {...props}
    >
      <div className="w-1 shrink-0 self-stretch rounded-full bg-destructive" />
      {content}
    </div>
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
