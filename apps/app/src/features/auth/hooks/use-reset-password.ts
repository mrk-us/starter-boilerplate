import { useSignIn } from "@clerk/tanstack-react-start";
import { useAuthRedirect } from "./use-auth-redirect";

interface ResetPasswordInput {
  code: string;
  password: string;
}

export function useResetPassword() {
  const { signIn } = useSignIn();
  const { navigate } = useAuthRedirect();

  const resetPassword = async ({ code, password }: ResetPasswordInput) => {
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });

    if (error) {
      throw error;
    }

    const { error: submitError } =
      await signIn.resetPasswordEmailCode.submitPassword({
        password,
        // A reset usually follows a lost or stolen password, so every other
        // session is dropped.
        signOutOfOtherSessions: true,
      });

    if (submitError) {
      throw submitError;
    }

    if (signIn.status !== "complete") {
      throw new Error(`Sign-in requires an unsupported step: ${signIn.status}`);
    }

    await signIn.finalize({ navigate });
  };

  const resendCode = async () => {
    const { error } = await signIn.resetPasswordEmailCode.sendCode();

    if (error) {
      throw error;
    }
  };

  return { resendCode, resetPassword };
}
