/*
 * Student join rules — mirrors the server's validation 1:1
 * (RaceRules.ROOM_CODE_LENGTH = 6, RacePlayerRules display name 2–30).
 */

export const ROOM_CODE_LENGTH = 6;

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 30;

// Room codes are alphanumeric; the server uppercases on its side too.
export const ROOM_CODE_ALLOWED_CHARS = /^[a-zA-Z0-9]*$/;

// The join response survives a refresh of the waiting page through
// sessionStorage (there is no student room-state endpoint yet to reload it).
export const STUDENT_JOIN_STORAGE_KEY = "quizwheelz.studentJoin";
