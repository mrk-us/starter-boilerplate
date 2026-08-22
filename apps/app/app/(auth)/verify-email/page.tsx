import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "@/features/auth/components";

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  title: `Verify your email | ${APP_NAME}`,
};

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
