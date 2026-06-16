export function getApiErrorMessage(error) {
    if (!error) {
        return 'אירעה שגיאה לא צפויה. נסה שוב.';
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    if (error.response?.data?.error) {
        return error.response.data.error;
    }

    if (error.message) {
        return error.message;
    }

    return 'אירעה שגיאה לא צפויה. נסה שוב.';
}