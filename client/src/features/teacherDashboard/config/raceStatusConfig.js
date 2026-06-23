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
        "bg-white text-amber-700 ring-1 ring-amber-200 shadow-[0_4px_12px_rgba(245,158,11,0.14)] font-black whitespace-nowrap",
    [RACE_STATUSES.READY]:
        "bg-white text-emerald-700 ring-1 ring-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.14)] font-black whitespace-nowrap",
    [RACE_STATUSES.IN_PROGRESS]:
        "bg-white text-green-700 ring-1 ring-green-200 shadow-[0_4px_12px_rgba(34,197,94,0.14)] font-black whitespace-nowrap",
    [RACE_STATUSES.FINISHED]:
        "bg-white text-violet-700 ring-1 ring-violet-200 shadow-[0_4px_12px_rgba(139,92,246,0.14)] font-black whitespace-nowrap",
    [RACE_STATUSES.CANCELLED]:
        "bg-white text-rose-700 ring-1 ring-rose-200 shadow-[0_4px_12px_rgba(244,63,94,0.14)] font-black whitespace-nowrap",
    [RACE_STATUSES.UNKNOWN]:
        "bg-white text-slate-600 ring-1 ring-slate-200 shadow-[0_4px_12px_rgba(15,23,42,0.08)] font-black whitespace-nowrap",
});

export const EDITABLE_RACE_STATUSES = Object.freeze([
    RACE_STATUSES.WAITING_FOR_PLAYERS,
    RACE_STATUSES.READY,
]);

export const CANCELLABLE_RACE_STATUSES = Object.freeze([
    RACE_STATUSES.WAITING_FOR_PLAYERS,
    RACE_STATUSES.READY,
]);