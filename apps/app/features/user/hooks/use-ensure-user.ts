"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef, useState } from "react";

type EnsureUserStatus = "idle" | "pending" | "success" | "error";

/**
 * Ensures the authenticated user exists in Convex DB.
 * Runs once on mount, handles webhook race condition.
 * Call this on pages where user needs to exist (e.g., setup page).
 */
export function useEnsureUser() {
	const { isAuthenticated } = useConvexAuth();
	const ensureUserAction = useConvexAction(
		api.users.actions.ensureCurrentUserExists,
	);

	const [status, setStatus] = useState<EnsureUserStatus>("idle");
	const hasRunRef = useRef(false);

	useEffect(() => {
		if (!isAuthenticated || hasRunRef.current) return;
		hasRunRef.current = true;

		setStatus("pending");

		console.log("Ensuring user exists");
		ensureUserAction({})
			.then(() => setStatus("success"))
			.catch((err) => {
				console.error("[useEnsureUser] Failed:", err);
				setStatus("error");
			});
	}, [isAuthenticated, ensureUserAction]);

	return { status };
}
