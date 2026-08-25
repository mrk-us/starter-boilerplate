import { api } from "@repo/backend/convex/_generated/api";
import { useQuery } from "convex/react";

export function ConvexStatus() {
  const status = useQuery(api.health.check);

  return (
    <p aria-live="polite">
      {status === undefined ? "Connecting to Convex..." : "Convex is connected"}
    </p>
  );
}
