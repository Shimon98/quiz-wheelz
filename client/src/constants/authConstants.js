export const AUTH_VALIDATION = {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 100,

    PASSWORD_MIN_LENGTH: 4,
    PASSWORD_MAX_LENGTH: 30,
};

export const AUTH_TEXT = {
    he: {
        labels: {
            username: 'שם משתמש',
            password: 'סיסמה',
            loginButton: 'התחברות',
            loading: 'טוען...',
            forgotPassword: 'שכחת סיסמה?',
        },

        placeholders: {
            username: 'GojoSatoru',
            password: '123456',
        },

        messages: {
            usernameRequired: 'חובה להזין שם משתמש',
            usernameMinLength: 'שם משתמש חייב להכיל לפחות 3 תווים',

            passwordRequired: 'חובה להזין סיסמה',
            passwordMinLength: 'סיסמה חייבת להכיל לפחות 4 תווים',

            invalidCredentials: 'שם המשתמש או הסיסמה אינם נכונים',
        },
    },

    en: {
        labels: {
            username: 'Username',
            password: 'Password',
            loginButton: 'Sign in',
            loading: 'Loading...',
            forgotPassword: 'Forgot password?',
        },

        placeholders: {
            username: 'GojoSatoru',
            password: '123456',
        },

        messages: {
            usernameRequired: 'Username is required',
            usernameMinLength: 'Username must contain at least 3 characters',

            passwordRequired: 'Password is required',
            passwordMinLength: 'Password must contain at least 4 characters',

            invalidCredentials: 'Invalid username or password',
        },
    },
};

export const MOCK_TEACHER_USER = {
    username: 'GojoSatoru',
    password: '123456',
    user: {
        userId: 1,
        displayName: 'Gojo Satoru',
        role: 'TEACHER',
    },
};

export const MOCK_ADMIN_USER = {
    username: 'AdminUser',
    password: '123456',
    user: {
        userId: 2,
        displayName: 'Admin User',
        role: 'ADMIN',
    },
};

export const MOCK_AUTH_USERS = [
    MOCK_TEACHER_USER,
    MOCK_ADMIN_USER,
];
