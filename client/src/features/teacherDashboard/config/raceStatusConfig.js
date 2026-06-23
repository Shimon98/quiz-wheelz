export const RACE_STATUSES = Object.freeze({
    WAITING_FOR_PLAYERS: "WAITING_FOR_PLAYERS",
    READY: "READY",
    IN_PROGRESS: "IN_PROGRESS",
    FINISHED: "FINISHED",
    CANCELLED: "CANCELLED",
    UNKNOWN: "UNKNOWN",
});

export const RACE_STATUS_LABELS = Object.freeze({
    [RACE_STATUSES.WAITING_FOR_PLAYERS]: RACE_STATUSES.WAITING_FOR_PLAYERS,
    [RACE_STATUSES.READY]: RACE_STATUSES.READY,
    [RACE_STATUSES.IN_PROGRESS]: RACE_STATUSES.IN_PROGRESS,
    [RACE_STATUSES.FINISHED]: RACE_STATUSES.FINISHED,
    [RACE_STATUSES.CANCELLED]: RACE_STATUSES.CANCELLED,
    [RACE_STATUSES.UNKNOWN]: RACE_STATUSES.UNKNOWN,
});

export const RACE_STATUS_TONES = Object.freeze({
    [RACE_STATUSES.WAITING_FOR_PLAYERS]: "amber",
    [RACE_STATUSES.READY]: "emerald",
    [RACE_STATUSES.IN_PROGRESS]: "green",
    [RACE_STATUSES.FINISHED]: "violet",
    [RACE_STATUSES.CANCELLED]: "rose",
    [RACE_STATUSES.UNKNOWN]: "slate",
});

export const RACE_STATUS_BADGE_CLASSES = Object.freeze({
    [RACE_STATUSES.WAITING_FOR_PLAYERS]:
        "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    [RACE_STATUSES.READY]:
        "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    [RACE_STATUSES.IN_PROGRESS]:
        "bg-green-100 text-green-700 ring-1 ring-green-200",
    [RACE_STATUSES.FINISHED]:
        "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
    [RACE_STATUSES.CANCELLED]:
        "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    [RACE_STATUSES.UNKNOWN]:
        "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
});

export const EDITABLE_RACE_STATUSES = Object.freeze([
    RACE_STATUSES.WAITING_FOR_PLAYERS,
    RACE_STATUSES.READY,
]);

export const CANCELLABLE_RACE_STATUSES = Object.freeze([
    RACE_STATUSES.WAITING_FOR_PLAYERS,
    RACE_STATUSES.READY,
]);