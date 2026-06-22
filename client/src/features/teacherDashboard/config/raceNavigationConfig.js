import {
    buildTeacherRaceLivePath,
    buildTeacherRaceResultsPath,
    buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";

export const RACE_NAVIGATION_PATHS = Object.freeze({
    room: buildTeacherRaceRoomPath,
    live: buildTeacherRaceLivePath,
    results: buildTeacherRaceResultsPath,
});

export const RACE_ID_FIELDS = Object.freeze(["raceId", "id"]);