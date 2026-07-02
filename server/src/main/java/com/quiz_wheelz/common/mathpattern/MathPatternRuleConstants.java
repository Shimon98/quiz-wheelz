package com.quiz_wheelz.common.mathpattern;

public final class MathPatternRuleConstants {

    public static final int NO_OPERATOR_COUNT = 0;
    public static final int SINGLE_OPERATOR_COUNT = 1;
    public static final int DIVISION_CHAIN_OPERATOR_COUNT = 2;
    public static final int SMALL_CHAIN_MULTIPLICATION_OPERATOR_COUNT = 2;

    public static final int BINARY_MAX_MULTIPLICATION_FACTOR = 10;
    public static final int COMPLEX_MAX_MULTIPLICATION_FACTOR = 5;
    public static final int SMALL_CHAIN_MAX_MULTIPLICATION_FACTOR = 5;

    public static final int MAX_DIVISION_FACTOR = 10;

    public static final int EASY_MAX_CORRECT_ANSWER_VALUE = 100;
    public static final int MEDIUM_MAX_CORRECT_ANSWER_VALUE = 120;
    public static final int HARD_MAX_CORRECT_ANSWER_VALUE = 150;

    public static final int SMALL_CHAIN_OPERANDS_COUNT = 3;
    public static final int SMALL_CHAIN_MAX_CORRECT_ANSWER_VALUE =
            SMALL_CHAIN_MAX_MULTIPLICATION_FACTOR
                    * SMALL_CHAIN_MAX_MULTIPLICATION_FACTOR
                    * SMALL_CHAIN_MAX_MULTIPLICATION_FACTOR;

    private MathPatternRuleConstants() {
    }
}
