/**
 * Hosts and subdomains the window may navigate or redirect to. Anything else
 * opens in the browser and stops the navigation, so a new OAuth provider or a
 * Stripe custom domain must be added here.
 */
export const ALLOWED_NAVIGATION_HOSTS = [
  "workos.com",
  "authkit.app",
  "accounts.google.com",
  // Google sign-in can pass through this host
  "accounts.youtube.com",
  "github.com",
  // In the window, Stripe has the session cookies and returns to the app origin
  "checkout.stripe.com",
  "billing.stripe.com",
];
