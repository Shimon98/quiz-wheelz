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

    public static final Set<QuestionType> SUPPORTED_MATH_QUESTION_TYPES = Set.of(
            QuestionType.ADDITION,
            QuestionType.SUBTRACTION,
            QuestionType.MULTIPLICATION,
            QuestionType.DIVISION
    );

    private QuestionRules() {
    }

    public static boolean isSupportedMathQuestionType(QuestionType questionType) {
        return SUPPORTED_MATH_QUESTION_TYPES.contains(questionType);
    }
}
