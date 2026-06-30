package com.quiz_wheelz.dto.question;

import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperator;
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
    private final MathExpressionPattern expressionPattern;
    private final List<Integer> operands;
    private final List<MathOperator> operators;
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
                MathExpressionPattern.BINARY_OPERATION,
                buildSimpleOperands(leftOperand, rightOperand),
                buildSimpleOperators(questionType),
                List.of()
        );
    }

    public MathQuestionData(
            String questionText,
            Integer correctAnswerValue,
            Integer leftOperand,
            Integer rightOperand,
            QuestionType questionType,
            MathExpressionPattern expressionPattern,
            List<Integer> operands,
            List<MathOperator> operators,
            List<Integer> preferredDistractorValues
    ) {
        this.questionText = questionText;
        this.correctAnswerValue = correctAnswerValue;
        this.leftOperand = leftOperand;
        this.rightOperand = rightOperand;
        this.questionType = questionType;
        this.expressionPattern = expressionPattern == null
                ? MathExpressionPattern.BINARY_OPERATION
                : expressionPattern;
        this.operands = safeIntegerCopy(operands);
        this.operators = safeOperatorCopy(operators);
        this.preferredDistractorValues = safeIntegerCopy(preferredDistractorValues);
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

    private static List<MathOperator> buildSimpleOperators(QuestionType questionType) {
        MathOperator mathOperator = switch (questionType) {
            case ADDITION -> MathOperator.ADDITION;
            case SUBTRACTION -> MathOperator.SUBTRACTION;
            case MULTIPLICATION -> MathOperator.MULTIPLICATION;
            case DIVISION -> MathOperator.DIVISION;
            default -> null;
        };

        if (mathOperator == null) {
            return List.of();
        }

        return List.of(mathOperator);
    }

    private static List<Integer> safeIntegerCopy(List<Integer> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(Objects::nonNull)
                .toList();
    }

    private static List<MathOperator> safeOperatorCopy(List<MathOperator> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(Objects::nonNull)
                .toList();
    }
}
