import { useUser } from "@/contexts/UserContext";

/**
 * Hook để lấy thông tin user hiện tại
 * @returns Object chứa user, userId, và isAuthenticated
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useUser();

  return {
    user,
    userId: user?._id || null,
    isAuthenticated,
  };
}

