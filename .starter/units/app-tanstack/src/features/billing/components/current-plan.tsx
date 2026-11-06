import { SUBSCRIPTION_PLAN } from "@repo/backend/convex/billing/constants";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components";
import { useSubscription } from "@/features/billing/hooks";

function formatDate(dateString: string | null): string {
  if (!dateString) {
    return "";
  }
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CurrentPlan() {
  const { currentPeriodEnd, cancelAtPeriodEnd, status, plan, isLoading } =
    useSubscription();

  if (isLoading) {
    return null;
  }

  const proStatusBadge = cancelAtPeriodEnd ? (
    <Badge variant="destructive">Cancelling</Badge>
  ) : (
    <Badge variant="default">Active</Badge>
  );
  // Only a subscription that needs a payment has a status on the Free plan
  const needsPayment = plan === SUBSCRIPTION_PLAN.FREE && status !== null;
  const freeStatusBadge = needsPayment ? (
    <Badge variant="destructive">Payment needed</Badge>
  ) : (
    <Badge variant="outline">Free</Badge>
  );
  const statusBadge =
    plan === SUBSCRIPTION_PLAN.PRO ? proStatusBadge : freeStatusBadge;
  const freeDescription = needsPayment
    ? "Update your payment method to get Pro features back"
    : "Upgrade to Pro for more features";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Plan</CardTitle>
          {statusBadge}
        </div>
        <CardDescription>
          {plan === SUBSCRIPTION_PLAN.PRO
            ? "You have access to all Pro features"
            : freeDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plan === SUBSCRIPTION_PLAN.PRO && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">
                  {status ?? "Active"}
                </span>
              </div>

              {currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {cancelAtPeriodEnd ? "Access until" : "Next billing date"}
                  </span>
                  <span className="font-medium">
                    {formatDate(currentPeriodEnd)}
                  </span>
                </div>
              )}

              {cancelAtPeriodEnd && (
                <p className="mt-2 text-amber-500 text-xs">
                  Your subscription will end on {formatDate(currentPeriodEnd)}.
                  You can resubscribe anytime.
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
