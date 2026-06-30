package com.quiz_wheelz.dto.question.student;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentQuestionChoiceResponse {

    private final Long choiceId;
    private final String choiceText;
    private final Integer displayOrder;
}
