// Reject backslashes and whitespace that browsers normalize into another origin.
const SAME_ORIGIN_PATH = /^\/(?![/\\])[^\\\s]*$/;

export function getReturnPath(path: unknown): string {
  if (typeof path !== "string" || !SAME_ORIGIN_PATH.test(path)) {
    return "/";
  }

  return path;
}

export function getSignInDestination(
  redirect: string | undefined,
  hash: string
) {
  // A browser can carry the fragment onto /sign-in after a server redirect.
  // The original HTTP request never includes it in the redirect search param.
  return redirect && !redirect.includes("#")
    ? `${redirect}${hash}`
    : (redirect ?? "/");
}
