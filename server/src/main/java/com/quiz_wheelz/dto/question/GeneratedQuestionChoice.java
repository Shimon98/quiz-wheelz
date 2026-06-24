package com.quiz_wheelz.dto.question;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GeneratedQuestionChoice {

    private final String choiceText;
    private final Integer answerValue;
    private final boolean correct;
    private final Integer displayOrder;
}
