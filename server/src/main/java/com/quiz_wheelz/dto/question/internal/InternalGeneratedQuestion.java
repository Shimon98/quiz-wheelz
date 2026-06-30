package com.quiz_wheelz.dto.question.internal;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class InternalGeneratedQuestion {

    @JsonIgnore
    private final Subject subject;

    @JsonIgnore
    private final QuestionTemplate questionTemplate;

    private final QuestionType questionType;
    private final Difficulty difficulty;
    private final String questionText;

    @JsonIgnore
    private final Integer correctAnswerValue;

    private final Integer timeLimitSeconds;
    private final List<InternalGeneratedQuestionChoice> choices;
}