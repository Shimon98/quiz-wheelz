import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageBackground from "../components/layout/PageBackground";
import AuthCard from "../components/auth/AuthCard";
import AppLogo from "../components/brand/AppLogo";
import LoginForm from "../components/auth/LoginForm";
import { loginUser } from "../api/authApi";
import { ROUTES } from "../constants/routeConstants";
import { useAuthStore } from "../stores/authStore";
import { USER_ROLES } from "../constants/roleConstants";
import { UI_VARIANTS } from "../constants/uiConstants.js";

export default function LoginPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasCheckedCurrentUser = useAuthStore(
      (state) => state.hasCheckedCurrentUser
  );
  const setUser = useAuthStore((state) => state.setUser);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

  function getRouteByRole(role) {
    if (role === USER_ROLES.ADMIN) {
      return ROUTES.ADMIN_DASHBOARD;
    }

    if (role === USER_ROLES.TEACHER) {
      return ROUTES.TEACHER_DASHBOARD;
    }

    return ROUTES.UNAUTHORIZED;
  }

  useEffect(() => {
    async function redirectIfAlreadyLoggedIn() {
      if (isAuthenticated && user) {
        navigate(getRouteByRole(user.role), { replace: true });
        return;
      }

      if (hasCheckedCurrentUser) {
        return;
      }

      const currentUser = await loadCurrentUser();

      if (currentUser) {
        navigate(getRouteByRole(currentUser.role), { replace: true });
      }
    }

    redirectIfAlreadyLoggedIn();
  }, [
    isAuthenticated,
    user,
    hasCheckedCurrentUser,
    loadCurrentUser,
    navigate,
  ]);

  const handleLogin = async (formData) => {
    const loggedInUser = await loginUser(formData);

    setUser(loggedInUser);
    navigate(getRouteByRole(loggedInUser.role), { replace: true });

    return loggedInUser;
  };

  if (isLoading) {
    return (
        <PageBackground variant={UI_VARIANTS.USER}>
          <AuthCard>
            <div className="text-center font-bold text-slate-700">
              בודק התחברות...
            </div>
          </AuthCard>
        </PageBackground>
    );
  }

  return (
      <PageBackground variant={UI_VARIANTS.USER}>
        <AuthCard>
          <div className="flex flex-col items-center gap-6">
            <AppLogo variant={UI_VARIANTS.USER} />
            <LoginForm onLogin={handleLogin} />
          </div>
        </AuthCard>
      </PageBackground>
  );
}