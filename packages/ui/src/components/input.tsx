import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@repo/ui/lib/utils";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"bg-white/50 dark:bg-input/30 shadow-glass-secondary focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:bg-destructive/10 aria-invalid:text-destructive aria-invalid:placeholder:text-destructive/60 dark:aria-invalid:bg-destructive/5 h-7 rounded-full px-3 py-0.5 text-sm transition-colors file:h-6 file:text-xs/relaxed file:font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] md:text-xs/relaxed file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
