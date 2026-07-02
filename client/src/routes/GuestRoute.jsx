import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { getRouteByRole } from "../utils/authRouteUtils";

/*
 * Mirror of ProtectedRoute: signed-in users never see the public entry pages
 * (landing / login / register / forgot-password) — they go straight to their
 * role's home. While the session check is in flight we still render the
 * public page (guests are the common case; a signed-in user gets redirected
 * the moment /me resolves).
 */
export default function GuestRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCheckedCurrentUser = useAuthStore(
      (state) => state.hasCheckedCurrentUser
  );
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

  useEffect(() => {
    if (!hasCheckedCurrentUser) {
      loadCurrentUser();
    }
  }, [hasCheckedCurrentUser, loadCurrentUser]);

  if (isAuthenticated && user) {
    return <Navigate to={getRouteByRole(user.role)} replace />;
  }

  return children;
}
