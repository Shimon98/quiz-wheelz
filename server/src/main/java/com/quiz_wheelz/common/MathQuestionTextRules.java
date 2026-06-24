package com.quiz_wheelz.common;

public final class MathQuestionTextRules {

    public static final String ADDITION_OPERATOR = "+";
    public static final String SUBTRACTION_OPERATOR = "-";
    public static final String MULTIPLICATION_OPERATOR = "×";
    public static final String DIVISION_OPERATOR = "÷";

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
}
