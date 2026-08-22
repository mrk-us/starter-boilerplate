import { useAuth } from "@workos/authkit-tanstack-react-start/client";

export function useAuthUser() {
  const { user, loading } = useAuth();

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  };
}
