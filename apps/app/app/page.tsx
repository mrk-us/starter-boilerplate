"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { ComponentExample } from "@/components/component-example";
import { useCurrentUser } from "@/hooks/auth/use-current-user";

export default function Home() {
	const { user } = useAuth();

	const { isLoading, user: currentUser } = useCurrentUser();

	return (
		<main className="flex flex-col mx-auto max-w-5xl gap-10 p-6 justify-center items-center">
			<h1>Dashboard</h1>

			{isLoading ? (
				<p>Loading...</p>
			) : (
				<pre>
					<code className="text-xs font-mono whitespace-pre-wrap">
						{JSON.stringify(currentUser, null, 2)}
					</code>
				</pre>
			)}

			<pre>
				<code className="text-xs font-mono whitespace-pre-wrap">
					{JSON.stringify(user, null, 2)}
				</code>
			</pre>
			<ComponentExample />
		</main>
	);
}
