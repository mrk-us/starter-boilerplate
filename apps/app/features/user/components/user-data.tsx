"use client";

import { useCurrentUser } from "@/features/user/hooks";

export function UserData() {
  const { user: currentUser } = useCurrentUser();

  return (
    <pre className="max-w-sm truncate">
      <code className="whitespace-pre-wrap font-mono text-xs">
        {JSON.stringify(currentUser, null, 2)}
      </code>
    </pre>
  );
}
