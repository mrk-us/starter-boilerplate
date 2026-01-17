import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { SignIn } from "@/features/auth/components/sign-in";

export const metadata: Metadata = {
	title: `Sign In | ${APP_NAME}`,
	description: APP_DESCRIPTION,
};

export default function SignInPage() {
	return <SignIn />;
}
