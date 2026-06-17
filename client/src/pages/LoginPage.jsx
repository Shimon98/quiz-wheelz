import PageBackground from '../components/layout/PageBackground';
import AuthCard from '../components/auth/AuthCard';
import AppLogo from '../components/brand/AppLogo';
import LoginForm from '../components/auth/LoginForm';
import { loginTeacher } from '../api/authApi';

export default function LoginPage() {
  const handleLogin = async (formData) => {
    // Call the API helper. If it throws, LoginForm will show the error.
    const user = await loginTeacher(formData);
    console.log('Logged user:', user);
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
