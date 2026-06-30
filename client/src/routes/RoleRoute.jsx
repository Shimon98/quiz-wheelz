import { Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routeConstants";
import { useAuthStore } from "../stores/authStore";

export default function RoleRoute({ children, allowedRoles }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={ROUTES.LANDING} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children;
}
