package com.quiz_wheelz.security;

public final class JwtSubjects {

    private static final String RACE_PLAYER_SUBJECT_PREFIX = "race-player-";

    public static String racePlayerSubject(Long racePlayerId) {
        return RACE_PLAYER_SUBJECT_PREFIX + racePlayerId;
    }

    private JwtSubjects() {
    }
}
