import { useState } from 'react';
import { getApiErrorMessage } from '../utils/apiError';

export default function useErrorMessage() {
    const [errorMessage, setErrorMessage] = useState('');

    function clearErrorMessage() {
        setErrorMessage('');
    }

    function setErrorFromApi(error) {
        setErrorMessage(getApiErrorMessage(error));
    }

    return {
        errorMessage,
        setErrorMessage,
        clearErrorMessage,
        setErrorFromApi,
    };
}