"use client";

import { useSignIn } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
	SignInEmailForm,
	SignInPasswordForm,
	SignInVerifyForm,
} from "@/features/auth/components";

type SignInStep = undefined | "password" | "verify";

export function SignIn() {
	const router = useRouter();
	const { signIn } = useSignIn();

	// Get params from URL
	const params = useParams<{ "sign-in"?: string[] }>();
	// Determine current step from URL
	const step = params["sign-in"]?.[0] as SignInStep;

	// Redirect to email step if there is no sign-in session
	useEffect(() => {
		if (step !== undefined && !signIn) {
			router.replace("/sign-in");
		}
	}, [step, signIn, router]);

	// Render password step
	if (step === "password") {
		return <SignInPasswordForm key="password" />;
	}

	// Render verify step
	if (step === "verify") {
		return <SignInVerifyForm key="verify" />;
	}

	// Render email step by default
	return <SignInEmailForm key="email" />;
}
