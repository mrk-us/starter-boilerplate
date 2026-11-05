import { handleCallbackRoute } from "@workos/authkit-tanstack-react-start";
import { getReturnPath, OAUTH_ERROR_REDIRECT } from "../return-path";
import { syncUserToDb } from "./user-sync.server";

export async function handleOAuthCallback({ request }: { request: Request }) {
  let returnPath: string | undefined;
  const response = await handleCallbackRoute({
    errorRedirectUrl: OAUTH_ERROR_REDIRECT,
    onSuccess: async ({ user, accessToken, state }) => {
      await syncUserToDb(user, accessToken);
      returnPath = getReturnPath(state);
    },
    returnPathname: "/",
  })({ request });

  // AuthKit assigns returnPathname to URL.pathname, which encodes fragments.
  // Restore the complete destination from verified state, keeping its cookies.
  if (returnPath !== undefined && response.status === 307) {
    response.headers.set("Location", new URL(returnPath, request.url).href);
  }

  return response;
}
