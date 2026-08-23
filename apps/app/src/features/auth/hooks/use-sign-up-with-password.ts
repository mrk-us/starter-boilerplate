import { useSignUp } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";

interface SignUpWithPasswordInput {
  email: string;
  password: string;
}

export function useSignUpWithPassword() {
  const { signUp } = useSignUp();
  const navigate = useNavigate();

  const signUpWithPassword = async ({
    email,
    password,
  }: SignUpWithPasswordInput) => {
    const { error } = await signUp.password({
      emailAddress: email,
      password,
    });

    if (error) {
      throw error;
    }

    const { error: sendCodeError } = await signUp.verifications.sendEmailCode();

    if (sendCodeError) {
      throw sendCodeError;
    }

    await navigate({ to: "/verify-email" });
  };

  return { signUpWithPassword };
}
