import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/features/auth/components";

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  title: `Create an account | ${APP_NAME}`,
};

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
