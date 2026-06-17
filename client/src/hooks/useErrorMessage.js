import { useState } from 'react';

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