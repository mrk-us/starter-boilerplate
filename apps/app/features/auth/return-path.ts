// Reject backslashes and whitespace that browsers normalize into another origin.
const SAME_ORIGIN_PATH = /^\/(?![/\\])[^\\\s]*$/;

export function getReturnPath(path: unknown): string {
  if (typeof path !== "string" || !SAME_ORIGIN_PATH.test(path)) {
    return "/";
  }

  return path;
}

export function getSignInDestination(redirect: string, hash: string) {
  // A browser can carry the fragment onto /sign-in after a server redirect.
  return redirect.includes("#") ? redirect : `${redirect}${hash}`;
}
