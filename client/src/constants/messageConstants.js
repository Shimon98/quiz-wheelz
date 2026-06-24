export const SUPPORTED_LANGUAGES = {
    HEBREW: 'he',
    ENGLISH: 'en',
};

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.HEBREW;

export const GENERAL_MESSAGES = {
    he: {
        generalError: 'אירעה שגיאה לא צפויה. נסה שוב.',
        networkError: 'לא ניתן להתחבר לשרת. נסה שוב בעוד רגע.',
        serverError: 'שגיאת שרת. נסה שוב בעוד רגע.',
    },

    en: {
        generalError: 'Something went wrong. Please try again.',
        networkError: 'Unable to connect to the server. Please try again.',
        serverError: 'Server error. Please try again later.',
    },
};