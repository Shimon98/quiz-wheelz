package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerGameplayMode;

import java.util.List;
import java.util.Objects;

public record StudentRaceGameplayResponse(
        RacePlayerGameplayMode mode,
        Double effectiveSpeed,
        List<StudentRaceActiveEffectResponse> activeEffects,
        StudentChallengeResponse challenge,
        StudentRacePowerUpsResponse powerUps,
        StudentRaceLuckResponse luck
) {
    public StudentRaceGameplayResponse(RacePlayerGameplayMode mode, Double effectiveSpeed,
                                       List<StudentRaceActiveEffectResponse> activeEffects, StudentChallengeResponse challenge) {
        this(mode, effectiveSpeed, activeEffects, challenge, new StudentRacePowerUpsResponse(0, null),
                new StudentRaceLuckResponse(List.of()));
    }

    public StudentRaceGameplayResponse {
        Objects.requireNonNull(mode);
        Objects.requireNonNull(effectiveSpeed);
        Objects.requireNonNull(challenge);
        Objects.requireNonNull(powerUps);
        Objects.requireNonNull(luck);
        activeEffects = List.copyOf(Objects.requireNonNull(activeEffects));
    }
}
