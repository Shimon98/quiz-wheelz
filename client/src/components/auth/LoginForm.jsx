import { useForm } from 'react-hook-form';
import TextInput from '../ui/TextInput';
import Button from '../ui/Button';
import FormError from '../ui/FormError';
import useErrorMessage from '../../hooks/useErrorMessage';

export default function LoginForm({ onLogin }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const {
    errorMessage,
    clearErrorMessage,
    setErrorFromApi,
  } = useErrorMessage();

  async function onSubmit(data) {
    clearErrorMessage();

    try {
      await onLogin(data);
    } catch (error) {
      setErrorFromApi(error);
    }
  }

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
        <div className="space-y-4">
          <TextInput
              label="שם משתמש"
              type="text"
              placeholder="teacher1"
              autoComplete="username"
              maxLength={100}
              error={errors.username?.message}
              {...register('username', {
                required: 'חובה להזין שם משתמש',
                minLength: {
                  value: 3,
                  message: 'שם משתמש חייב להכיל לפחות 3 תווים',
                },
              })}
          />

          <TextInput
              label="סיסמה"
              type="password"
              placeholder="123456"
              autoComplete="current-password"
              maxLength={30}
              error={errors.password?.message}
              {...register('password', {
                required: 'חובה להזין סיסמה',
                minLength: {
                  value: 4,
                  message: 'סיסמה חייבת להכיל לפחות 4 תווים',
                },
              })}
          />

          <Button type="submit" isLoading={isSubmitting}>
            התחברות
          </Button>

          <FormError message={errorMessage} />
        </div>
      </form>
  );
}