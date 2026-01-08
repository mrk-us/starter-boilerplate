"use client";

import { useCurrentUser } from "@/features/shared/hooks/user/use-current-user";

export function UserData() {
	const { user: currentUser } = useCurrentUser();

	return (
		<pre>
			<code className="text-xs font-mono whitespace-pre-wrap">
				{JSON.stringify(currentUser, null, 2)}
			</code>
		</pre>
	);
}
