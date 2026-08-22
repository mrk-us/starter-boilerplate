import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@repo/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-clip-padding font-medium text-xs/relaxed outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default:
          "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
      },
      variant: {
        default:
          "rounded-full bg-[white]/[7.5%] text-foreground shadow-glass-secondary hover:bg-[white]/10",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30",
        primary:
          "rounded-full bg-gradient-to-b from-white/90 to-white/80 text-background shadow-glass-primary *:stroke-background hover:bg-[white]/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
      },
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  pending = false,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { pending?: boolean }) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ size, variant }), className)}
      data-slot="button"
      {...props}
    >
      {pending ? (
        <>
          <Spinner className="absolute top-1/2 left-1/2 m-auto -translate-x-1/2 -translate-y-1/2" />
          <span className="opacity-0" style={{ letterSpacing: "inherit" }}>
            {props.children}
          </span>
        </>
      ) : (
        props.children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
