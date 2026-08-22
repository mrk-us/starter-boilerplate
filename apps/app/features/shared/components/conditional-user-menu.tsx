"use client";

import { usePathname } from "next/navigation";
import { isPublicPath } from "@/lib/routes";
import { UserMenu } from "./user-menu";

export function ConditionalUserMenu() {
  const pathname = usePathname();

  // Don't show UserMenu on auth pages
  if (isPublicPath(pathname)) {
    return null;
  }

  return <UserMenu />;
}
