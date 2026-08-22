"use client";

import type { StripePriceLookupKey } from "@repo/backend/convex/billing/types";
import { Button } from "@repo/ui/components";
import type { buttonVariants } from "@repo/ui/components/button";
import type { VariantProps } from "class-variance-authority";
import { useCheckout } from "@/features/billing/hooks";

type CheckoutButtonProps = {
	priceLookupKey: StripePriceLookupKey;
	children: React.ReactNode;
	variant: VariantProps<typeof buttonVariants>["variant"];
	className?: string;
	successUrl?: string;
};

/**
 * A checkout button that creates a Stripe checkout session when clicked.
 */
export function CheckoutButton({
	priceLookupKey,
	children,
	variant = "primary",
	className,
	successUrl,
}: CheckoutButtonProps) {
	const { checkout, isPending } = useCheckout();

	const handleClick = () => {
		checkout({ priceLookupKey, successUrl });
	};

	return (
		<Button
			variant={variant}
			className={className}
			onClick={handleClick}
			disabled={isPending}
			pending={isPending}
		>
			{isPending ? "Loading..." : children}
		</Button>
	);
}
