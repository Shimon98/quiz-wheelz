package com.quiz_wheelz.dto.question.student;

import lombok.Getter;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import java.util.Objects;

import java.util.List;

@Getter
public class StudentQuestionResponse {

    private final Long questionId;
    private final QuestionGameplayContext gameplayContext;
    private final String questionText;
    private final Integer timeLimitSeconds;
    private final Long serverTimeEpochMs;
    private final Long expiresAtEpochMs;
    private final List<StudentQuestionChoiceResponse> choices;

    public StudentQuestionResponse(
            Long questionId,
            QuestionGameplayContext gameplayContext,
            String questionText,
            Integer timeLimitSeconds,
            Long serverTimeEpochMs,
            Long expiresAtEpochMs,
            List<StudentQuestionChoiceResponse> choices
    ) {
        this.questionId = questionId;
        this.gameplayContext = Objects.requireNonNull(gameplayContext);
        this.questionText = questionText;
        this.timeLimitSeconds = timeLimitSeconds;
        this.serverTimeEpochMs = serverTimeEpochMs;
        this.expiresAtEpochMs = expiresAtEpochMs;
        this.choices = choices == null ? List.of() : List.copyOf(choices);
    }
}
