"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@repo/ui/lib/utils";
import * as React from "react";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
	onMouseDown,
	onClick,
	...props
}: PopoverPrimitive.Trigger.Props) {
	const triggeredRef = React.useRef(false);

	return (
		<PopoverPrimitive.Trigger
			data-slot="popover-trigger"
			onMouseDown={(event) => {
				// Prevent opening on right click or middle click
				if (event.button !== 0) return;

				// Open onMouseDown
				triggeredRef.current = true;
				event.currentTarget.click();
				onMouseDown?.(event);
			}}
			onClick={(event) => {
				// Allow keyboard activation and onMouseDown-triggered clicks
				if (!triggeredRef.current && event.detail !== 0) {
					event.preventBaseUIHandler();
				}

				// Reset the trigger
				triggeredRef.current = false;
				onClick?.(event);
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
				side={side}
				sideOffset={sideOffset}
				className="isolate z-50"
			>
				<PopoverPrimitive.Popup
					data-slot="popover-content"
					className={cn(
						"rounded-3xl corner-superellipse/1.2 supports-backdrop-filter:backdrop-blur-lg supports-backdrop-filter:backdrop-saturate-250 bg-popover/90 shadow-glass-secondary-elevated  text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 flex flex-col gap-4 p-2.5 text-xs ring-0 duration-100 z-50 w-72 origin-(--transform-origin) outline-hidden",
						className,
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="popover-header"
			className={cn("flex flex-col gap-1 text-xs", className)}
			{...props}
		/>
	);
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
	return (
		<PopoverPrimitive.Title
			data-slot="popover-title"
			className={cn("text-sm font-medium", className)}
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
			data-slot="popover-description"
			className={cn("text-muted-foreground", className)}
			{...props}
		/>
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
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
};
