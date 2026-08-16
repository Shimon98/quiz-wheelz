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
  RACE_PLAYERS: {
    JOIN: "/race-players/join",
    // Gameplay/runtime endpoints (server: RacePlayerController via ApiPaths) —
    // the student is resolved from the racePlayerToken cookie, no ids in the URL.
    RACE_STATE: "/race-players/me/race-state",
    CURRENT_QUESTION: "/race-players/me/question/current",
    SUBMIT_ANSWER: "/race-players/me/answers",
    HEARTBEAT: "/race-players/me/heartbeat",
    LEAVE: "/race-players/me/leave",
    RECONNECT: "/race-players/me/reconnect",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    RACES: "/teacher/races",
    RACE_ROOM: (raceId) => `/teacher/races/${raceId}/room`,
    RACE_START: (raceId) => `/teacher/races/${raceId}/start`,
  },
};
