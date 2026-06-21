export const RACE_NAVIGATION_PATHS = Object.freeze({
    room: (raceId) => `/teacher/races/${raceId}`,
    live: (raceId) => `/teacher/races/${raceId}/live`,
    results: (raceId) => `/teacher/races/${raceId}/results`,
});

export const RACE_ID_FIELDS = Object.freeze(["raceId", "id"]);
