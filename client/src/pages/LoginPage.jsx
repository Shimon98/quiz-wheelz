import PageBackground from '../components/layout/PageBackground';
import AuthCard from '../components/auth/AuthCard';
import AppLogo from '../components/brand/AppLogo';
import LoginForm from '../components/auth/LoginForm';
import { loginUser } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routeConstants';
import { useAuthStore } from '../stores/authStore';
import { USER_ROLES } from '../constants/roleConstants';
import {UI_VARIANTS} from "../constants/uiConstants.js";

export default function LoginPage() {
  function getRouteByRole(role) {
    if (role === USER_ROLES.ADMIN) {
      return ROUTES.ADMIN_DASHBOARD;
    }

    if (role === USER_ROLES.TEACHER) {
      return ROUTES.TEACHER_DASHBOARD;
    }

    return ROUTES.UNAUTHORIZED;
  }
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (formData) => {
    const user = await loginUser(formData);

    setUser(user);
    navigate(getRouteByRole(user.role));

    return user;
  };

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
