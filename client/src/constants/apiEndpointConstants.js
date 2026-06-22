export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
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
