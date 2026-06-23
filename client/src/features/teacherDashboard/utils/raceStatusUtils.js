import {
    CANCELLABLE_RACE_STATUSES,
    EDITABLE_RACE_STATUSES,
    RACE_STATUSES,
    RACE_STATUS_TONES,
} from "../config/raceStatusConfig";

export function isRaceEditable(status) {
    return EDITABLE_RACE_STATUSES.includes(status);
}

export function isRaceCancellable(status) {
    return CANCELLABLE_RACE_STATUSES.includes(status);
}

export function isRaceWaiting(status) {
    return status === RACE_STATUSES.WAITING_FOR_PLAYERS;
}

export function isRaceInProgress(status) {
    return status === RACE_STATUSES.IN_PROGRESS;
}

export function isRaceFinished(status) {
    return status === RACE_STATUSES.FINISHED;
}

export function getRaceStatusTone(status) {
    return (
        RACE_STATUS_TONES[status] ??
        RACE_STATUS_TONES[RACE_STATUSES.UNKNOWN]
    );
}

export function getRaceActionLabel(status, actionLabels = {}) {
    if (isRaceWaiting(status) || status === RACE_STATUSES.READY) {
        return actionLabels.openRoom ?? "";
    }

    if (isRaceInProgress(status)) {
        return actionLabels.viewLiveRace ?? "";
    }

    if (isRaceFinished(status)) {
        return actionLabels.viewResults ?? "";
    }

    return actionLabels.unavailable ?? "";
}