"use client";

import { Button } from "@repo/ui/components/button";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import type { User } from "@workos-inc/node";
import { Authenticated, Unauthenticated } from "convex/react";
import { ComponentExample } from "@/components/component-example";
import { useCurrentUser } from "@/hooks/auth/use-current-user";

export default function Home() {
	const { user, signOut } = useAuth();

	const { isLoading, user: currentUser } = useCurrentUser();

	return (
		<>
			<header className="sticky top-0 z-10 px-5 py-4 flex flex-row justify-between items-center">
				Convex + Next.js + WorkOS
				{user && <UserMenu user={user} onSignOut={signOut} />}
			</header>
			<main>
				<Authenticated>
					{isLoading ? (
						<p>Loading...</p>
					) : (
						<pre>
							<code>{JSON.stringify(currentUser, null, 2)}</code>
						</pre>
					)}

					<pre>
						<code>{JSON.stringify(user, null, 2)}</code>
					</pre>
					<ComponentExample />
				</Authenticated>
				<Unauthenticated>
					<SignInForm />
				</Unauthenticated>
			</main>
		</>
	);
}

function SignInForm() {
	return (
		<div className="flex flex-col gap-8 w-96 mx-auto">
			<p>Log in to see the numbers</p>
			<a href="/sign-in">
				<Button variant="primary">Sign in</Button>
			</a>
			<a href="/sign-up">
				<Button>Sign up</Button>
			</a>
		</div>
	);
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm">{user.email}</span>
			<Button onClick={onSignOut}>Sign out</Button>
		</div>
	);
}
