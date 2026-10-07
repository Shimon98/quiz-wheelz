package com.quiz_wheelz.dto.raceplayer;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record StudentChallengeChoiceRequest(@NotNull @Positive Long offerId, String choice) {
}
