/*
 * Student join rules — mirrors the server's validation 1:1
 * (RaceRules.ROOM_CODE_LENGTH = 6, RacePlayerRules display name 2–30).
 */

export const ROOM_CODE_LENGTH = 6;

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 30;

// Room codes are alphanumeric; the server uppercases on its side too.
export const ROOM_CODE_ALLOWED_CHARS = /^[a-zA-Z0-9]*$/;

// Join-response DISPLAY cache only (name/lane/counters that race-state does
// not return). Never session truth — the server's RacePlayer cookie +
// race-state own validity; a missing cache never redirects anyone.
export const STUDENT_JOIN_STORAGE_KEY = "quizwheelz.studentJoin";

// Temporary change detection while WAITING: refetch race-state on this
// interval. A future SSE "race started" event replaces only this trigger —
// race-state stays the source of truth.
export const STUDENT_WAITING_POLL_MS = 2000;
