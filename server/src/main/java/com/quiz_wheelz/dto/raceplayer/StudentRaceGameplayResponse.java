package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerGameplayMode;

import java.util.List;
import java.util.Objects;

public record StudentRaceGameplayResponse(
        RacePlayerGameplayMode mode,
        Double effectiveSpeed,
        List<StudentRaceActiveEffectResponse> activeEffects
) {
    public StudentRaceGameplayResponse {
        Objects.requireNonNull(mode);
        Objects.requireNonNull(effectiveSpeed);
        activeEffects = List.copyOf(Objects.requireNonNull(activeEffects));
    }
}
