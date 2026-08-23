import type { SetActiveNavigate } from "@clerk/tanstack-react-start/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";

/**
 * Where to send the browser once Clerk has an active session
 *
 * The `_auth` layout validates `redirect` down to a same-origin path, so what
 * arrives here is already safe to navigate to.
 */
export function useAuthRedirect() {
  const { redirect } = useSearch({ from: "/_auth" });
  const routerNavigate = useNavigate();
  const destination = redirect ?? "/";

  const navigate = useCallback<SetActiveNavigate>(
    ({ decorateUrl }) => {
      // `decorateUrl` can hand back a Clerk-hosted URL that refreshes the
      // session cookie for Safari's ITP, which needs a full page load.
      const url = decorateUrl(destination);

      if (url.startsWith("http")) {
        window.location.href = url;
        return;
      }

      return routerNavigate({ href: url });
    },
    [destination, routerNavigate]
  );

  return { destination, navigate };
}
