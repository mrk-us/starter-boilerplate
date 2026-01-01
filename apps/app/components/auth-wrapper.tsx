"use client";

import { Button } from "@repo/ui/components/button";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthWrapper({ children }: { children: ReactNode }) {
	return (
		<>
			<Authenticated>{children}</Authenticated>
			<Unauthenticated>
				<SignInForm />
			</Unauthenticated>
		</>
	);
}

function SignInForm() {
	return (
		<div className="flex flex-row gap-2 mx-auto">
			<Link href="/sign-in">
				<Button variant="primary">Sign in</Button>
			</Link>
			<Link href="/sign-up">
				<Button>Sign up</Button>
			</Link>
		</div>
	);
}
