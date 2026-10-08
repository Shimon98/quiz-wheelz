package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.ChallengeOutcome;

public record StudentChallengeResultResponse(Long challengeId, ChallengeChoice type, ChallengeOutcome outcome,
                                             int questionsResolved, int correctAnswers, Long completedAtEpochMs) {
}
