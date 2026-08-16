export const ROUTES = {
  LANDING: "/",
  LOGIN: "/login",
  TEACHER_LOGIN: "/teacher/login",
  TEACHER_REGISTER: "/teacher/register",
  TEACHER_FORGOT_PASSWORD: "/teacher/forgot-password",
  ADMIN_DASHBOARD: "/admin",
  TEACHER_DASHBOARD: "/teacher",
  TEACHER_RACES: "/teacher/races",
  TEACHER_RACE_ROOM: "/teacher/races/:raceId/room",
  TEACHER_RACE_LIVE: "/teacher/races/:raceId/live",
  TEACHER_RACE_RESULTS: "/teacher/races/:raceId/results",
  STUDENT_JOIN: "/join",
  STUDENT_JOIN_WITH_CODE: "/join/:roomCode",
  STUDENT_WAITING: "/student/waiting",
  STUDENT_RACE: "/student/race",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",
};

export function buildTeacherRaceRoomPath(raceId) {
  return `/teacher/races/${raceId}/room`;
}

export function buildStudentJoinPath(roomCode) {
  return `/join/${roomCode}`;
}

export function buildTeacherRaceLivePath(raceId) {
  return `/teacher/races/${raceId}/live`;
}

export function buildTeacherRaceResultsPath(raceId) {
  return `/teacher/races/${raceId}/results`;
}