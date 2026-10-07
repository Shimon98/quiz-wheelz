package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.ChallengeChoice;
import java.util.List;

public record StudentChallengeOfferResponse(Long offerId, Long expiresAtEpochMs, List<ChallengeChoice> choices) {
    public StudentChallengeOfferResponse {
        choices = List.copyOf(choices);
    }
}
