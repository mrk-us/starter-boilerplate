import { cn } from "@repo/ui/lib/utils";
import { IconLoader } from "@tabler/icons-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <IconLoader
      aria-label="Loading"
      className={cn("size-4 animate-spin text-primary", className)}
      role="status"
      {...props}
    />
  );
}

export { Spinner };
