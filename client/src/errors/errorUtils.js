import { ERROR_CODES } from './errorCodes';
import { SECURITY_MESSAGES } from './errorMessages';
import { AUTH_TEXT } from '../constants/authConstants';
import {
    DEFAULT_LANGUAGE,
    GENERAL_MESSAGES,
} from '../constants/messageConstants';

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