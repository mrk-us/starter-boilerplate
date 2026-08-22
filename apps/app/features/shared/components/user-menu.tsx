"use client";

import { useClerk } from "@clerk/nextjs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { useCurrentUser } from "@/features/user/hooks";

export function UserMenu() {
  const { signOut } = useClerk();
  const { user } = useCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between gap-2 p-4 electron:[app-region:drag] electron:[&_a,&_button]:[app-region:no-drag]">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/">Dashboard</Link>
        <Link href="/account">Account</Link>
        <Link href="/account/billing">Billing</Link>
      </div>

      <div className="flex items-center gap-2">
        <Avatar size="sm">
          {user.profilePictureUrl ? (
            <AvatarImage
              alt={user.name ?? "Avatar"}
              src={user.profilePictureUrl || ""}
            />
          ) : null}
          <AvatarFallback />
        </Avatar>
        <span className="text-sm">{user.email}</span>
        <Button onClick={() => signOut({ redirectUrl: "/sign-in" })}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
