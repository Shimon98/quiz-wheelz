package com.quiz_wheelz.dto.question;

import com.quiz_wheelz.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MathQuestionData {

    private final String questionText;
    private final Integer correctAnswerValue;
    private final Integer leftOperand;
    private final Integer rightOperand;
    private final QuestionType questionType;
}
