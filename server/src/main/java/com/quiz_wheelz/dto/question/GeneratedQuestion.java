package com.quiz_wheelz.dto.question;

import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class GeneratedQuestion {

    private final Subject subject;
    private final QuestionTemplate questionTemplate;
    private final QuestionType questionType;
    private final Difficulty difficulty;
    private final String questionText;
    private final Integer correctAnswerValue;
    private final Integer timeLimitSeconds;
    private final List<GeneratedQuestionChoice> choices;
}
