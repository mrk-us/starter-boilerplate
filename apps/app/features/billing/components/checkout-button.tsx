"use client";

import { Button } from "@repo/ui/components";
import { useCheckout } from "@/features/billing/hooks";

type CheckoutButtonProps = {
	productIds: string[];
	children: React.ReactNode;
	variant?: "default" | "primary" | "outline";
	className?: string;
	successUrl?: string;
};

/**
 * A checkout button that only creates a Polar customer when clicked.
 * Unlike CheckoutLink, this doesn't pre-generate the checkout URL on mount.
 */
export function CheckoutButton({
	productIds,
	children,
	variant = "primary",
	className,
	successUrl,
}: CheckoutButtonProps) {
	const { checkout, isPending } = useCheckout();

	const handleClick = () => {
		checkout({ productIds, successUrl });
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
