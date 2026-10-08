package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.ChallengeChoice;

public record StudentChallengeRunResponse(Long challengeId, ChallengeChoice type,
                                          int questionsResolved, int totalQuestions, int correctAnswers) {
}
