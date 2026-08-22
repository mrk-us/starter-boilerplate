"use client";

import type { StripePriceLookupKey } from "@repo/backend/convex/billing/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components";
import { CheckoutButton } from "./checkout-button";

interface PlanCardProps {
  features: string[];
  interval: "month" | "year";
  isCurrentPlan: boolean;
  isPopular?: boolean;
  isPro: boolean;
  name: string;
  price: number;
  priceLookupKey: StripePriceLookupKey;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

export function PlanCard({
  name,
  price,
  interval,
  priceLookupKey,
  features,
  isCurrentPlan,
  isPro,
  isPopular,
}: PlanCardProps) {
  const monthlyEquivalent = interval === "year" ? price / 12 : price;
  const checkoutLabel = isPro ? `Switch to ${name}` : `Upgrade to ${name}`;

  return (
    <Card
      className={`relative ${isPopular ? "ring-2 ring-primary" : ""} ${isCurrentPlan ? "opacity-75" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default">Most Popular</Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {isCurrentPlan && <Badge variant="outline">Current</Badge>}
        </div>
        <CardDescription>
          <span className="font-bold text-2xl text-foreground">
            {formatPrice(price)}
          </span>
          <span className="text-white/50">/{interval}</span>
          {interval === "year" && (
            <span className="ml-2 text-green-500 text-xs">
              ({formatPrice(monthlyEquivalent)}/mo)
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li className="flex items-center gap-2" key={feature}>
              <CheckIcon />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button className="w-full" disabled variant="outline">
            Current Plan
          </Button>
        ) : (
          <CheckoutButton
            className="w-full"
            priceLookupKey={priceLookupKey}
            variant="default"
          >
            {checkoutLabel}
          </CheckoutButton>
        )}
      </CardFooter>
    </Card>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 text-green-500"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        fillRule="evenodd"
      />
    </svg>
  );
}
