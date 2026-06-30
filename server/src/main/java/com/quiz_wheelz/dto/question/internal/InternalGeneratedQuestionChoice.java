package com.quiz_wheelz.dto.question.internal;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class InternalGeneratedQuestionChoice {

    private final String choiceText;

    @JsonIgnore
    private final Integer answerValue;

    @JsonIgnore
    private final boolean correct;

    private final Integer displayOrder;
}