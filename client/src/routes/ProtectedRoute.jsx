import { Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routeConstants";
import { useAuthStore } from "../stores/authStore";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
}
