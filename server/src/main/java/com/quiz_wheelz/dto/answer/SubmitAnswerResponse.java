package com.quiz_wheelz.dto.answer;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Timing fields are absolute Unix epoch milliseconds — the client uses them
 * for authoritative answer/deadline timing, so a zone-less LocalDateTime is
 * not allowed on this wire contract (C1-02K).
 */
@Getter
@AllArgsConstructor
public class SubmitAnswerResponse {

    private Long questionId;
    private Long selectedChoiceId;
    private boolean correct;
    private Long correctAnswerChoiceId;
    private String questionStatus;
    private Long answeredAtEpochMs;
    private Long expiresAtEpochMs;
    private StudentAnswerRaceImpactResponse raceImpact;
}
