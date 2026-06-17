import { useState } from 'react';
import {
    getErrorMessageByCode,
    getMessageFromApiError,
} from '../errors/errorUtils';
import { DEFAULT_LANGUAGE } from '../constants/messageConstants';

export default function useErrorMessage(language = DEFAULT_LANGUAGE) {
    const [errorMessage, setErrorMessage] = useState('');

    function clearErrorMessage() {
        setErrorMessage('');
    }

    function setErrorMessageByCode(errorCode) {
        setErrorMessage(getErrorMessageByCode(errorCode, language));
    }

    function setErrorMessageFromApiError(error) {
        setErrorMessage(getMessageFromApiError(error, language));
    }

    return {
        errorMessage,
        setErrorMessage,
        clearErrorMessage,
        setErrorMessageByCode,
        setErrorMessageFromApiError,
    };
}