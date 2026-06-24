export const ROUTES = {
  LOGIN: "/login",
  ADMIN_DASHBOARD: "/admin",
  TEACHER_DASHBOARD: "/teacher",
  TEACHER_RACE_ROOM: "/teacher/races/:raceId",
  TEACHER_RACE_LIVE: "/teacher/races/:raceId/live",
  TEACHER_RACE_RESULTS: "/teacher/races/:raceId/results",
  STUDENT_JOIN: "/join",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",
};

export function buildTeacherRaceRoomPath(raceId) {
  return `/teacher/races/${raceId}`;
}

export function buildTeacherRaceLivePath(raceId) {
  return `/teacher/races/${raceId}/live`;
}

export function buildTeacherRaceResultsPath(raceId) {
  return `/teacher/races/${raceId}/results`;
}