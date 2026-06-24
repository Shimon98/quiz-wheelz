package com.quiz_wheelz.common;

import com.quiz_wheelz.enums.MathOperator;

import java.util.List;

public final class MathQuestionTextRules {

    public static final String ADDITION_OPERATOR = "+";
    public static final String SUBTRACTION_OPERATOR = "-";
    public static final String MULTIPLICATION_OPERATOR = "×";
    public static final String DIVISION_OPERATOR = "÷";

    public static final String OPEN_PARENTHESIS = "(";
    public static final String CLOSE_PARENTHESIS = ")";
    public static final String EQUALS_SIGN = "=";
    public static final String ANSWER_PLACEHOLDER = "?";
    public static final String TOKEN_SEPARATOR = " ";

    private MathQuestionTextRules() {
    }

    public static String buildBinaryQuestionText(
            int leftOperand,
            String operator,
            int rightOperand
    ) {
        return leftOperand
                + TOKEN_SEPARATOR + operator
                + TOKEN_SEPARATOR + rightOperand
                + TOKEN_SEPARATOR + EQUALS_SIGN
                + TOKEN_SEPARATOR + ANSWER_PLACEHOLDER;
    }

    public static String buildExpressionQuestionText(
            List<Integer> operands,
            List<MathOperator> operators
    ) {
        validateExpressionParts(operands, operators);

        StringBuilder questionText = new StringBuilder();
        questionText.append(operands.get(0));

        for (int index = 0; index < operators.size(); index++) {
            questionText
                    .append(TOKEN_SEPARATOR)
                    .append(operatorSymbol(operators.get(index)))
                    .append(TOKEN_SEPARATOR)
                    .append(operands.get(index + 1));
        }

        questionText
                .append(TOKEN_SEPARATOR)
                .append(EQUALS_SIGN)
                .append(TOKEN_SEPARATOR)
                .append(ANSWER_PLACEHOLDER);

        return questionText.toString();
    }

    public static String buildParenthesesAroundFirstTwoOperandsQuestionText(
            List<Integer> operands,
            List<MathOperator> operators
    ) {
        validateExpressionParts(operands, operators);

        return OPEN_PARENTHESIS
                + operands.get(0)
                + TOKEN_SEPARATOR + operatorSymbol(operators.get(0))
                + TOKEN_SEPARATOR + operands.get(1)
                + CLOSE_PARENTHESIS
                + TOKEN_SEPARATOR + operatorSymbol(operators.get(1))
                + TOKEN_SEPARATOR + operands.get(2)
                + TOKEN_SEPARATOR + EQUALS_SIGN
                + TOKEN_SEPARATOR + ANSWER_PLACEHOLDER;
    }

    public static String buildParenthesesAroundLastTwoOperandsQuestionText(
            List<Integer> operands,
            List<MathOperator> operators
    ) {
        validateExpressionParts(operands, operators);

        return operands.get(0)
                + TOKEN_SEPARATOR + operatorSymbol(operators.get(0))
                + TOKEN_SEPARATOR + OPEN_PARENTHESIS
                + operands.get(1)
                + TOKEN_SEPARATOR + operatorSymbol(operators.get(1))
                + TOKEN_SEPARATOR + operands.get(2)
                + CLOSE_PARENTHESIS
                + TOKEN_SEPARATOR + EQUALS_SIGN
                + TOKEN_SEPARATOR + ANSWER_PLACEHOLDER;
    }

    public static String operatorSymbol(MathOperator operator) {
        return switch (operator) {
            case ADDITION -> ADDITION_OPERATOR;
            case SUBTRACTION -> SUBTRACTION_OPERATOR;
            case MULTIPLICATION -> MULTIPLICATION_OPERATOR;
            case DIVISION -> DIVISION_OPERATOR;
        };
    }

    private static void validateExpressionParts(
            List<Integer> operands,
            List<MathOperator> operators
    ) {
        if (operands == null
                || operators == null
                || operands.size() < QuestionRules.SIMPLE_BINARY_OPERANDS_COUNT
                || operators.size() != operands.size() - 1) {
            throw new IllegalArgumentException("Invalid math expression parts");
        }
    }
}
