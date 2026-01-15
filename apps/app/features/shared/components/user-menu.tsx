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

	if (!user) return null;

	return (
		<div className="flex items-center gap-2 w-full justify-between p-4">
			<div className="flex items-center gap-2 text-sm">
				<Link href="/">Dashboard</Link>
				<Link href="/account">Account</Link>
				<Link href="/account/billing">Billing</Link>
			</div>

			<div className="flex items-center gap-2">
				<Avatar size="sm">
					{user.profilePictureUrl ? (
						<AvatarImage
							src={user.profilePictureUrl || ""}
							alt={user.name ?? "Avatar"}
						/>
					) : null}
					<AvatarFallback></AvatarFallback>
				</Avatar>
				<span className="text-sm">{user.email}</span>
				<Button onClick={() => signOut()}>Sign out</Button>
			</div>
		</div>
	);
}
