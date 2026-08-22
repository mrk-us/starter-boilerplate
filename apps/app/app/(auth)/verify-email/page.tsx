import { Suspense } from "react";
import { VerifyEmailForm } from "@/features/auth/components";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
