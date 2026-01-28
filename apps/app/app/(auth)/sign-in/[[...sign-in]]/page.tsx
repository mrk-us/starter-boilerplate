import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/components";

export const metadata: Metadata = {
	title: `Sign In | ${APP_NAME}`,
	description: APP_DESCRIPTION,
};

export default function SignInPage() {
	return (
		<Suspense>
			<SignInForm />
		</Suspense>
	);
}
