import { ERROR_CODES } from './errorCodes';
import { AUTH_TEXT } from './authConstants';
import { DEFAULT_LANGUAGE, GENERAL_MESSAGES } from './messageConstants';

const SECURITY_MESSAGES = {
    he: {
        invalidRequest: 'בקשה לא תקינה.',
        invalidToken: 'החיבור שלך פג תוקף. התחבר מחדש.',
        unauthorized: 'אין הרשאה. יש להתחבר מחדש.',
        forbidden: 'אין לך הרשאה לבצע פעולה זו.',
    },

    en: {
        invalidRequest: 'Invalid request.',
        invalidToken: 'Your session has expired. Please log in again.',
        unauthorized: 'You are not authorized. Please log in again.',
        forbidden: 'You are not allowed to perform this action.',
    },
};

export function getErrorMessageByCode(errorCode, language = DEFAULT_LANGUAGE) {
    const authText = AUTH_TEXT[language] ?? AUTH_TEXT.he;
    const generalText = GENERAL_MESSAGES[language] ?? GENERAL_MESSAGES.he;
    const securityText = SECURITY_MESSAGES[language] ?? SECURITY_MESSAGES.he;

    const errorMessages = {
        [ERROR_CODES.INVALID_REQUEST]: securityText.invalidRequest,

        [ERROR_CODES.MISSING_USERNAME]: authText.messages.usernameRequired,
        [ERROR_CODES.INVALID_USERNAME]: authText.messages.usernameMinLength,

        [ERROR_CODES.MISSING_PASSWORD]: authText.messages.passwordRequired,
        [ERROR_CODES.INVALID_PASSWORD]: authText.messages.passwordMinLength,

        [ERROR_CODES.INVALID_CREDENTIALS]: authText.messages.invalidCredentials,

        [ERROR_CODES.INTERNAL_SERVER_ERROR]: generalText.serverError,

        [ERROR_CODES.INVALID_TOKEN]: securityText.invalidToken,
        [ERROR_CODES.UNAUTHORIZED]: securityText.unauthorized,
        [ERROR_CODES.FORBIDDEN]: securityText.forbidden,
    };

    return errorMessages[errorCode] ?? generalText.generalError;
}

export function getMessageFromApiError(error, language = DEFAULT_LANGUAGE) {
    const generalText = GENERAL_MESSAGES[language] ?? GENERAL_MESSAGES.he;

    const errorCode =
        error?.response?.data?.errorCode ??
        error?.response?.data?.code;

    if (errorCode) {
        return getErrorMessageByCode(errorCode, language);
    }

    if (error?.message === 'Network Error') {
        return generalText.networkError;
    }

    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.message) {
        return error.message;
    }

    return generalText.generalError;
}