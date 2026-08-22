"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared/utils";
import { Button, type buttonVariants } from "@repo/ui/components";
import { useMutation } from "@tanstack/react-query";
import type { VariantProps } from "class-variance-authority";

type CustomerPortalButtonProps = {
	children: React.ReactNode;
	variant?: VariantProps<typeof buttonVariants>["variant"];
	size?: VariantProps<typeof buttonVariants>["size"];
	className?: string;
};

/**
 * A button that opens the Stripe Customer Portal for subscription management.
 */
export function CustomerPortalButton({
	children,
	variant = "outline",
	size = "sm",
	className,
}: CustomerPortalButtonProps) {
	const generatePortalUrl = useConvexAction(
		api.billing.actions.generateCustomerPortalUrl,
	);

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			const result = await generatePortalUrl({
				returnUrl: window.location.href,
			});
			if (result?.url) {
				window.open(result.url, "_blank");
			}
		},
		onError: (err) => {
			console.error("Failed to open customer portal:", getErrorMessage(err));
		},
	});

	return (
		<Button
			variant={variant}
			size={size}
			className={className}
			onClick={() => mutate()}
			disabled={isPending}
		>
			{isPending ? "Loading..." : children}
		</Button>
	);
}
