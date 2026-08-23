"use client";

import { tryCatch } from "@repo/shared/utils";
import { useState, useTransition } from "react";

interface Feedback {
  isError: boolean;
  message: string;
}

/**
 * Requests a fresh verification code and reports the outcome inline
 *
 * Clerk rate-limits code requests, so the failure message is shown rather than
 * silently dropped.
 */
export function ResendCodeButton({ resend }: { resend: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleResend = () => {
    setFeedback(null);

    startTransition(async () => {
      const { error } = await tryCatch(resend());

      setFeedback(
        error
          ? { isError: true, message: error.message }
          : { isError: false, message: "We sent a new code." }
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-1 text-xs">
      <button
        className="text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-2 disabled:opacity-50"
        disabled={isPending}
        onClick={handleResend}
        type="button"
      >
        Send a new code
      </button>

      {feedback && (
        <p
          aria-live="polite"
          className={feedback.isError ? "text-destructive" : "text-positive"}
          role="status"
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
