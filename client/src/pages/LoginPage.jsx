import PageBackground from '../components/layout/PageBackground';
import AuthCard from '../components/auth/AuthCard';
import AppLogo from '../components/brand/AppLogo';
import LoginForm from '../components/auth/LoginForm';
import { loginTeacher } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routeConstants';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (formData) => {
    const user = await loginTeacher(formData);

    setUser(user);
    navigate(ROUTES.TEACHER_DASHBOARD);

    return user;
  };

  return (
    <PageBackground variant={"teacher"}>
      <AuthCard>
        <div className="flex flex-col items-center gap-6">
          <AppLogo variant={"teacher"} />
          <LoginForm onLogin={handleLogin} />
        </div>
      </AuthCard>
    </PageBackground>
  );
}
