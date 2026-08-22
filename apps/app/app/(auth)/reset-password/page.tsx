import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components";

export const metadata: Metadata = {
	title: `Reset your password | ${APP_NAME}`,
	description: APP_DESCRIPTION,
};

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}
