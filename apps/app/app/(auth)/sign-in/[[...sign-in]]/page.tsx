import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/components";

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  title: `Sign In | ${APP_NAME}`,
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
