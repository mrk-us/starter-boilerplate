import { useSignIn } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";

export function useForgotPassword() {
  const { signIn } = useSignIn();
  const navigate = useNavigate();

  const forgotPassword = async ({ email }: { email: string }) => {
    const { error } = await signIn.create({ identifier: email });

    if (error) {
      throw error;
    }

    const { error: sendCodeError } =
      await signIn.resetPasswordEmailCode.sendCode();

    if (sendCodeError) {
      throw sendCodeError;
    }

    // The sign-in attempt lives on the Clerk client, so /reset-password picks
    // up where this left off.
    await navigate({ to: "/reset-password" });
  };

  return { forgotPassword };
}
