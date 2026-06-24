package com.quiz_wheelz.dto.question;

import com.quiz_wheelz.enums.QuestionType;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
public class MathQuestionData {

    private final String questionText;
    private final Integer correctAnswerValue;
    private final Integer leftOperand;
    private final Integer rightOperand;
    private final QuestionType questionType;
    private final List<Integer> operands;
    private final List<Integer> preferredDistractorValues;

    public MathQuestionData(
            String questionText,
            Integer correctAnswerValue,
            Integer leftOperand,
            Integer rightOperand,
            QuestionType questionType
    ) {
        this(
                questionText,
                correctAnswerValue,
                leftOperand,
                rightOperand,
                questionType,
                buildSimpleOperands(leftOperand, rightOperand),
                List.of()
        );
    }

    public MathQuestionData(
            String questionText,
            Integer correctAnswerValue,
            Integer leftOperand,
            Integer rightOperand,
            QuestionType questionType,
            List<Integer> operands,
            List<Integer> preferredDistractorValues
    ) {
        this.questionText = questionText;
        this.correctAnswerValue = correctAnswerValue;
        this.leftOperand = leftOperand;
        this.rightOperand = rightOperand;
        this.questionType = questionType;
        this.operands = safeCopy(operands);
        this.preferredDistractorValues = safeCopy(preferredDistractorValues);
    }

    private static List<Integer> buildSimpleOperands(
            Integer leftOperand,
            Integer rightOperand
    ) {
        List<Integer> simpleOperands = new ArrayList<>();

        if (leftOperand != null) {
            simpleOperands.add(leftOperand);
        }

        if (rightOperand != null) {
            simpleOperands.add(rightOperand);
        }

        return simpleOperands;
    }

    private static List<Integer> safeCopy(List<Integer> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(Objects::nonNull)
                .toList();
    }
}
