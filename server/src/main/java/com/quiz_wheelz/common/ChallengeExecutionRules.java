package com.quiz_wheelz.common;

import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;

import java.util.Set;

public final class ChallengeExecutionRules {
    public static final int TIME_LIMIT_SECONDS = 15;
    public static final Set<QuestionGenerationPattern> TURBO_GENERATION_PATTERNS = Set.of(
            QuestionGenerationPattern.ADD_THEN_MULTIPLY,
            QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT,
            QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY,
            QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM,
            QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN);
    public static final Set<QuestionType> SAFE_QUESTION_TYPES = Set.of(QuestionType.ADDITION, QuestionType.SUBTRACTION);
    public static final int TURBO_QUESTIONS = 1;
    public static final int SAFE_QUESTIONS = 3;
    public static final int TURBO_PROGRESS = 80;
    public static final int TURBO_SCORE = 40;
    public static final int SAFE_PROGRESS = 15;
    public static final int SAFE_SCORE = 8;
    public static final int SAFE_PERFECT_PROGRESS = 10;
    public static final int SAFE_PERFECT_SCORE = 6;
    public static final int FAILURE_MAGNITUDE_TENTHS = 2;
    public static final long FAILURE_DURATION_MS = 4000;

    private ChallengeExecutionRules() {
    }
}
