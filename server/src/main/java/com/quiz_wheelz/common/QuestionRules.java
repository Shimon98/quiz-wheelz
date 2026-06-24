package com.quiz_wheelz.common;

import com.quiz_wheelz.enums.QuestionType;

import java.util.Set;

public final class QuestionRules {

    public static final String DEFAULT_SUBJECT_CODE = "MATH";

    public static final int DEFAULT_CHOICES_COUNT = 4;
    public static final int MIN_CHOICES_COUNT = 2;
    public static final int MAX_CHOICES_COUNT = 6;

    public static final int DEFAULT_TIME_LIMIT_SECONDS = 30;
    public static final int MIN_TIME_LIMIT_SECONDS = 5;
    public static final int MAX_TIME_LIMIT_SECONDS = 300;

    public static final int MIN_DISTRACTOR_VALUE = 0;
    public static final int MAX_DISTRACTOR_GENERATION_ATTEMPTS = 30;
    public static final int MAX_QUESTION_GENERATION_ATTEMPTS = 30;

    public static final int FIRST_OPERAND_INDEX = 0;
    public static final int SECOND_OPERAND_INDEX = 1;
    public static final int THIRD_OPERAND_INDEX = 2;
    public static final int FOURTH_OPERAND_INDEX = 3;

    public static final int SIMPLE_BINARY_OPERANDS_COUNT = 2;
    public static final int COMPLEX_EXPRESSION_OPERANDS_COUNT = 3;
    public static final int MIXED_OPERATORS_EXPRESSION_OPERANDS_COUNT = 4;

    public static final int MIN_DIVISION_FACTOR_VALUE = 1;
    public static final int MIN_COMPLEX_EXPRESSION_ADDEND_VALUE = 1;
    public static final int MIN_COMPLEX_EXPRESSION_MULTIPLIER_VALUE = 2;

    public static final Set<QuestionType> SUPPORTED_MATH_QUESTION_TYPES = Set.of(
            QuestionType.ADDITION,
            QuestionType.SUBTRACTION,
            QuestionType.MULTIPLICATION,
            QuestionType.DIVISION,
            QuestionType.ORDER_OF_OPERATIONS,
            QuestionType.PARENTHESES
    );

    private QuestionRules() {
    }

    public static boolean isSupportedMathQuestionType(QuestionType questionType) {
        return questionType != null && SUPPORTED_MATH_QUESTION_TYPES.contains(questionType);
    }
}
