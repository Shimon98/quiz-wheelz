import {useForm} from 'react-hook-form';
import TextInput from '../../../shared/components/ui/TextInput';
import AuthButton from '../../../shared/components/ui/AuthButton';
import FormError from '../../../shared/components/ui/FormError';
import useErrorMessage from '../../../hooks/useErrorMessage';

import {UI_CLASSES} from '../../../styles/theme';
import {DEFAULT_LANGUAGE} from "../../../constants/messageConstants.js";
import {AUTH_TEXT, AUTH_VALIDATION} from "../../../constants/authConstants.js";
import { getLanguageDirection } from '../../../utils/languageDirectionUtils';

export default function LoginForm({onLogin, onForgotPassword, language = DEFAULT_LANGUAGE,}) {
    const authText = AUTH_TEXT[language] ?? AUTH_TEXT.he;
    const direction = getLanguageDirection(language);

    const {register, handleSubmit, formState: {errors, isSubmitting},} = useForm({
        defaultValues: {username: '', password: '',}, mode: 'onTouched', reValidateMode: 'onChange',
    });

    const {errorMessage, clearErrorMessage, setErrorMessageFromApiError,} = useErrorMessage(language);

    async function onSubmit(data) {
        clearErrorMessage();
        try {
            await onLogin(data);
        } catch (error) {
            setErrorMessageFromApiError(error);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
            <div className="space-y-0.5">
                <TextInput
                    label=""
                    type="text"
                    placeholder={authText.labels.username}
                    aria-label={authText.labels.username}
                    autoComplete="username"
                    maxLength={AUTH_VALIDATION.USERNAME_MAX_LENGTH}
                    error={errors.username?.message}
                    direction={direction}
                    {...register('username', {
                        required: authText.messages.usernameRequired,
                        minLength: {
                            value: AUTH_VALIDATION.USERNAME_MIN_LENGTH,
                            message: authText.messages.usernameMinLength,
                        },
                    })}
                />
                <TextInput
                    label=""
                    type="password"
                    placeholder={authText.labels.password}
                    aria-label={authText.labels.password}
                    autoComplete="current-password"
                    maxLength={AUTH_VALIDATION.PASSWORD_MAX_LENGTH}
                    error={errors.password?.message}
                    direction={direction}
                    showPasswordLabel={authText.labels.showPassword}
                    hidePasswordLabel={authText.labels.hidePassword}
                    {...register('password', {
                        required: authText.messages.passwordRequired,
                        minLength: {
                            value: AUTH_VALIDATION.PASSWORD_MIN_LENGTH,
                            message: authText.messages.passwordMinLength,
                        },
                    })}
                />
                <AuthButton
                    type="submit"
                    isLoading={isSubmitting}
                    language={language}
                >
                    {authText.labels.loginButton}
                </AuthButton>

                <div className="min-h-6 text-center">
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className={UI_CLASSES.secondaryLink}
                    >
                        {authText.labels.forgotPassword}
                    </button>
                </div>

                <FormError message={errorMessage}/>
            </div>
        </form>
    );
}
