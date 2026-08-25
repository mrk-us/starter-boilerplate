"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

const AUTH_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function ConditionalUserMenu() {
  const pathname = usePathname();

  // Don't show UserMenu on auth pages
  if (AUTH_PATHS.includes(pathname)) {
    return null;
  }

  return <UserMenu />;
}
