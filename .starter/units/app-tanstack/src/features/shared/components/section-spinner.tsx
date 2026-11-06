import { Button } from "@repo/ui/components/button";
import { Spinner } from "@repo/ui/components/spinner";
import { useEffect, useState } from "react";

const LOAD_TIMEOUT_MS = 15_000;

export function SectionSpinner() {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-6">
      <Spinner />
      {isTimedOut ? (
        <>
          <p className="text-center text-sm" role="alert">
            This is taking longer than expected. Check your connection, then
            reload the page.
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </>
      ) : null}
    </div>
  );
}
