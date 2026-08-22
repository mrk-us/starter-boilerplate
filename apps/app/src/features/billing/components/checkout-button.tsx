import type { StripePriceLookupKey } from "@repo/backend/convex/billing/types";
import { Button } from "@repo/ui/components";
import type { buttonVariants } from "@repo/ui/components/button";
import type { VariantProps } from "class-variance-authority";
import { useCheckout } from "@/features/billing/hooks";

interface CheckoutButtonProps {
  children: React.ReactNode;
  className?: string;
  priceLookupKey: StripePriceLookupKey;
  successUrl?: string;
  variant: VariantProps<typeof buttonVariants>["variant"];
}

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
      className={className}
      disabled={isPending}
      onClick={handleClick}
      pending={isPending}
      variant={variant}
    >
      {isPending ? "Loading..." : children}
    </Button>
  );
}
