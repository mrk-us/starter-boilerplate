"use client";

import type { StripePriceLookupKey } from "@repo/backend/convex/billing/constants";
import { Button } from "@repo/ui/components";
import { useCheckout } from "@/features/billing/hooks";

type CheckoutButtonProps = {
	priceLookupKey: StripePriceLookupKey;
	children: React.ReactNode;
	variant?: "default" | "primary" | "outline";
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
		>
			{isPending ? "Loading..." : children}
		</Button>
	);
}
