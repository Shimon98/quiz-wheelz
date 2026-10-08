package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.ChallengeChoice;

public record StudentChallengeChoiceResponse(Long offerId, ChallengeChoice choice, Long selectedAtEpochMs,
                                             StudentRaceRuntimeSnapshotResponse snapshot) {
}
