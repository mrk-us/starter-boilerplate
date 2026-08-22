import { Suspense } from "react";
import { CompleteSetup } from "@/features/setup/components";
import { SectionSpinner } from "@/features/shared/components/section-spinner";

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-2xl">Welcome! Let's get started</h1>
        <p className="text-muted-foreground">
          Please enter your name to complete your account setup.
        </p>
      </div>
      <div className="w-full">
        <Suspense fallback={<SectionSpinner />}>
          <CompleteSetup />
        </Suspense>
      </div>
    </main>
  );
}
