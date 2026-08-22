"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@repo/ui/lib/utils";
import { type ComponentProps, useRef } from "react";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  onMouseDown,
  onClick,
  ...props
}: PopoverPrimitive.Trigger.Props) {
  const triggeredRef = useRef(false);

  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      onClick={(event) => {
        // Allow keyboard activation and onMouseDown-triggered clicks
        // biome-ignore lint/suspicious/noUnnecessaryConditions: onMouseDown can mutate the ref before this click handler runs.
        if (!triggeredRef.current && event.detail !== 0) {
          event.preventBaseUIHandler();
        }

        // Reset the trigger
        triggeredRef.current = false;
        onClick?.(event);
      }}
      onMouseDown={(event) => {
        // Prevent opening on right click or middle click
        if (event.button !== 0) {
          return;
        }

        // Open onMouseDown
        triggeredRef.current = true;
        event.currentTarget.click();
        onMouseDown?.(event);
      }}
      {...props}
    />
  );
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          className={cn(
            "corner-superellipse/1.2 data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 flex w-72 origin-(--transform-origin) flex-col gap-3 rounded-3xl bg-popover/90 px-4 py-3.5 text-popover-foreground text-xs shadow-glass-secondary-elevated outline-hidden ring-0 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-lg supports-backdrop-filter:backdrop-saturate-250",
            className
          )}
          data-slot="popover-content"
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1 text-xs", className)}
      data-slot="popover-header"
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      className={cn("font-medium text-sm", className)}
      data-slot="popover-title"
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      className={cn("text-muted-foreground", className)}
      data-slot="popover-description"
      {...props}
    />
  );
}

function PopoverFooter({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex gap-2 *:flex-1 sm:flex-row", className)}
      data-slot="popover-footer"
      {...props}
    >
      {children}
    </div>
  );
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
