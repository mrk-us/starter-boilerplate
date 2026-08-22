import { APP_NAME } from "@repo/config";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CompleteSetup } from "@/features/setup/components";
import { SectionSpinner } from "@/features/shared/components";
import { useCurrentUser } from "@/features/user/hooks";

export const Route = createFileRoute("/_authenticated/setup")({
  component: SetupPage,
  head: () => ({ meta: [{ title: `Set up your account | ${APP_NAME}` }] }),
});

function SetupPage() {
  const { isLoading, user } = useCurrentUser();
  const navigate = useNavigate();
  const isSetupComplete = !isLoading && Boolean(user?.setupComplete);

  useEffect(() => {
    if (isSetupComplete) {
      navigate({ replace: true, to: "/" });
    }
  }, [isSetupComplete, navigate]);

  if (isLoading || isSetupComplete) {
    return <SectionSpinner />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-2xl">Welcome! Let's get started</h1>
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
