"use client";

import {
  Badge,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components";
import { CustomerPortalButton } from "./customer-portal-button";

interface FreePlanCardProps {
  isCurrentPlan: boolean;
}

export function FreePlanCard({ isCurrentPlan }: FreePlanCardProps) {
  return (
    <Card className={isCurrentPlan ? "" : "opacity-75"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Free</CardTitle>
          {isCurrentPlan && <Badge variant="default">Current</Badge>}
        </div>
        <CardDescription>
          <div className="flex items-center">
            <span className="font-bold text-2xl text-foreground">$0</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardFooter>
        {!isCurrentPlan && (
          <CustomerPortalButton
            className="w-full"
            size="default"
            variant="outline"
          >
            Downgrade
          </CustomerPortalButton>
        )}
      </CardFooter>
    </Card>
  );
}
