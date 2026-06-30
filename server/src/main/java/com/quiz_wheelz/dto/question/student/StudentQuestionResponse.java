package com.quiz_wheelz.dto.question.student;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class StudentQuestionResponse {

    private final Long questionId;
    private final String questionText;
    private final Integer timeLimitSeconds;
    private final LocalDateTime expiresAt;
    private final List<StudentQuestionChoiceResponse> choices;

    public StudentQuestionResponse(
            Long questionId,
            String questionText,
            Integer timeLimitSeconds,
            LocalDateTime expiresAt,
            List<StudentQuestionChoiceResponse> choices
    ) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.timeLimitSeconds = timeLimitSeconds;
        this.expiresAt = expiresAt;
        this.choices = choices == null ? List.of() : List.copyOf(choices);
    }
}
