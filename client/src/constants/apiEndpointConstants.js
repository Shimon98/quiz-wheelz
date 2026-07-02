export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
    // Not implemented on the server yet (Diana) — the client is wired and
    // ready; these become live the moment the server ships them.
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    VERIFY_RESET_CODE: "/auth/verify-reset-code",
    RESET_PASSWORD: "/auth/reset-password",
  },
  SUBJECTS: {
    LIST: "/subjects",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    RACES: "/teacher/races",
    RACE_ROOM: (raceId) => `/teacher/races/${raceId}/room`,
  },
};
