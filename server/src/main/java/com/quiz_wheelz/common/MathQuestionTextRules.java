package com.quiz_wheelz.common;

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

    public static String buildOrderOfOperationsQuestionText(
            int firstOperand,
            String firstOperator,
            int secondOperand,
            String secondOperator,
            int thirdOperand
    ) {
        return firstOperand
                + TOKEN_SEPARATOR + firstOperator
                + TOKEN_SEPARATOR + secondOperand
                + TOKEN_SEPARATOR + secondOperator
                + TOKEN_SEPARATOR + thirdOperand
                + TOKEN_SEPARATOR + EQUALS_SIGN
                + TOKEN_SEPARATOR + ANSWER_PLACEHOLDER;
    }

    public static String buildParenthesesQuestionText(
            int firstOperand,
            String innerOperator,
            int secondOperand,
            String outerOperator,
            int thirdOperand
    ) {
        return OPEN_PARENTHESIS
                + firstOperand
                + TOKEN_SEPARATOR + innerOperator
                + TOKEN_SEPARATOR + secondOperand
                + CLOSE_PARENTHESIS
                + TOKEN_SEPARATOR + outerOperator
                + TOKEN_SEPARATOR + thirdOperand
                + TOKEN_SEPARATOR + EQUALS_SIGN
                + TOKEN_SEPARATOR + ANSWER_PLACEHOLDER;
    }
}
