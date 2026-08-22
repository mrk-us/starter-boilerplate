import { cn } from "@repo/ui/lib/utils";
import { IconLoader } from "@tabler/icons-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<IconLoader
			role="status"
			aria-label="Loading"
			className={cn("size-4 text-primary animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
