import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routeConstants";
import { useAuthStore } from "../stores/authStore";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasCheckedCurrentUser = useAuthStore(
      (state) => state.hasCheckedCurrentUser
  );
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

  useEffect(() => {
    if (!isAuthenticated && !hasCheckedCurrentUser) {
      loadCurrentUser();
    }
  }, [isAuthenticated, hasCheckedCurrentUser, loadCurrentUser]);

  if (isLoading || !hasCheckedCurrentUser) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-sky-100">
          <p className="text-lg font-bold text-slate-700">
            בודק התחברות...
          </p>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LANDING} replace />;
  }

  return children;
}