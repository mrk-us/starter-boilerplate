import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@repo/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Spinner } from "./spinner";

const buttonVariants = cva(
	"relative focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
	{
		variants: {
			variant: {
				default:
					"bg-[white]/[7.5%] text-primary-foreground hover:bg-[white]/10 rounded-full text-foreground shadow-glass-secondary",
				primary:
					"bg-gradient-to-b from-white/90 to-white/80 hover:bg-[white]/90 rounded-full text-background *:stroke-background shadow-glass-primary",
				outline:
					"border-border dark:bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
				ghost:
					"hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
				destructive:
					"bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-7 gap-1 px-3 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
				sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
				icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
				"icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
				"icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
				"icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
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
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{pending ? (
				<>
					<Spinner className="absolute left-1/2 top-1/2 m-auto -translate-x-1/2 -translate-y-1/2" />
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
