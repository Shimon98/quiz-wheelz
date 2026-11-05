package com.quiz_wheelz.enums;

// The gameplay facts a teacher's live feed may tell, written by the server with the answer that caused them (S4-06).
// They live inside the QUESTION_ANSWERED payload JSON, never in a column. Hidden Recovery is never one of them, and
// neither is a student's failure: a lost Turbo, an imperfect Safe run or a wrong answer.
public enum RacePublicMomentKind {
    TURBO_SUCCESS,
    SAFE_PERFECT,
    SHIELD_EARNED,
    LUCK_TAILWIND,
    LUCK_ENERGY_ORB,
    LUCK_MUD,
    LUCK_SHIELD_BLOCKED
}
