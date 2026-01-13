import { Suspense } from "react";
import { SignInForm } from "@/features/auth/components";

export default function SignInPage() {
	return (
		<Suspense>
			<SignInForm />
		</Suspense>
	);
}
