"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { useCurrentUser } from "@/features/shared/hooks/user/use-current-user";

export function UserMenu() {
	const { signOut } = useAuth();
	const { user } = useCurrentUser();

	if (!user) return null;

	return (
		<div className="flex items-center gap-2 w-full justify-between p-4">
			<div className="flex items-center gap-2 text-sm">
				<Link href="/">Dashboard</Link>
				<Link href="/account">Account</Link>
			</div>

			<div className="flex items-center gap-2">
				<Avatar size="sm">
					{user.profilePictureKey || user.profilePictureUrl ? (
						<AvatarImage
							src={user.profilePictureUrl || user.profilePictureKey || ""}
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
