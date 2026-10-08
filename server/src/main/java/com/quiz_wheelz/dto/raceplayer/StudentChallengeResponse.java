package com.quiz_wheelz.dto.raceplayer;

public record StudentChallengeResponse(int energy, int threshold, StudentChallengeOfferResponse offer,
                                       StudentChallengeRunResponse run, StudentChallengeResultResponse lastResult) {
}
