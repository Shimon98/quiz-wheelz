import { RACE_ID_FIELDS, RACE_NAVIGATION_PATHS } from "../config/raceNavigationConfig";
import { RACE_STATUSES } from "../config/raceStatusConfig";

function getRaceId(race) {
    if (!race) {
        return null;
    }

    const raceIdField = RACE_ID_FIELDS.find((field) => race[field] !== undefined);

    return raceIdField ? race[raceIdField] : null;
}

export function getRaceNavigationPath(race) {
    const raceId = getRaceId(race);

    if (!raceId || !race?.status) {
        return null;
    }

    if (
        race.status === RACE_STATUSES.WAITING_FOR_PLAYERS ||
        race.status === RACE_STATUSES.READY
    ) {
        return RACE_NAVIGATION_PATHS.room(raceId);
    }

    if (race.status === RACE_STATUSES.IN_PROGRESS) {
        return RACE_NAVIGATION_PATHS.live(raceId);
    }

    if (race.status === RACE_STATUSES.FINISHED) {
        return RACE_NAVIGATION_PATHS.results(raceId);
    }

    return null;
}
