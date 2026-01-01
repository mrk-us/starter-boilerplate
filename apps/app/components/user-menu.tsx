"use client";

import { Button } from "@repo/ui/components/button";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";

export function UserMenu() {
	const { user, signOut } = useAuth();

	if (!user) return null;

	return (
		<div className="flex items-center gap-2 w-full justify-between p-4">
			<div className="flex items-center gap-2 text-sm">
				<Link href="/">Dashboard</Link>
				<Link href="/account">Account</Link>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm">{user.email}</span>
				<Button onClick={() => signOut()}>Sign out</Button>
			</div>
		</div>
	);
}
