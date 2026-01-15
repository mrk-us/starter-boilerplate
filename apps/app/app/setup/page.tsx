"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CompleteSetup } from "@/features/setup/components";

export default function SetupPage() {
	const { isLoaded, sessionClaims } = useAuth();
	const router = useRouter();

	// Check if onboarding is already complete via session claims
	const onboardingComplete = sessionClaims?.metadata?.onboardingComplete;

	// Redirect if setup already completed
	useEffect(() => {
		if (isLoaded && onboardingComplete) {
			router.replace("/");
		}
	}, [isLoaded, onboardingComplete, router]);

	// Show nothing while loading or redirecting
	if (!isLoaded || onboardingComplete) {
		return null;
	}

	return (
		<main className="flex flex-col mx-auto max-w-md gap-6 p-6 justify-center items-center min-h-screen">
			<div className="text-center space-y-2">
				<h1 className="text-2xl font-semibold">Welcome! Let's get started</h1>
				<p className="text-muted-foreground">
					Please enter your name to complete your account setup.
				</p>
			</div>
			<div className="w-full">
				<CompleteSetup />
			</div>
		</main>
	);
}
