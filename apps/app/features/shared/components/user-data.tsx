"use client";

import { useCurrentUser } from "@/features/user/hooks";

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
