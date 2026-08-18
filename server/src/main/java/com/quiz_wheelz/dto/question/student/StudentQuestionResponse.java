package com.quiz_wheelz.dto.question.student;

import lombok.Getter;

import java.util.List;

/**
 * Safe student question contract. Timing is absolute Unix epoch
 * milliseconds (C1-02K):
 *
 * expiresAtEpochMs — the authoritative question deadline.
 * serverTimeEpochMs — the server clock at response construction, so the
 * client can calibrate a device clock that is slightly wrong.
 *
 * Never expose a zone-less LocalDateTime here and never any correctness
 * data — the server alone judges answers and expiry.
 */
@Getter
public class StudentQuestionResponse {

    private final Long questionId;
    private final String questionText;
    private final Integer timeLimitSeconds;
    private final Long serverTimeEpochMs;
    private final Long expiresAtEpochMs;
    private final List<StudentQuestionChoiceResponse> choices;

    public StudentQuestionResponse(
            Long questionId,
            String questionText,
            Integer timeLimitSeconds,
            Long serverTimeEpochMs,
            Long expiresAtEpochMs,
            List<StudentQuestionChoiceResponse> choices
    ) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.timeLimitSeconds = timeLimitSeconds;
        this.serverTimeEpochMs = serverTimeEpochMs;
        this.expiresAtEpochMs = expiresAtEpochMs;
        this.choices = choices == null ? List.of() : List.copyOf(choices);
    }
}
