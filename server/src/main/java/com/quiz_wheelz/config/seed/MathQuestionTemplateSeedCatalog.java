package com.quiz_wheelz.config.seed;

import com.quiz_wheelz.common.QuestionTemplateSeedRules;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;

import java.util.List;

public final class MathQuestionTemplateSeedCatalog {

    private MathQuestionTemplateSeedCatalog() {
    }

    public static List<MathQuestionTemplateSeed> defaultMathSeeds() {
        return List.of(
                seed(QuestionType.ADDITION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.SUBTRACTION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.MULTIPLICATION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.DIVISION, Difficulty.EASY, QuestionGenerationPattern.BINARY_OPERATION),

                seed(QuestionType.ADDITION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.SUBTRACTION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.MULTIPLICATION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.DIVISION, Difficulty.MEDIUM, QuestionGenerationPattern.BINARY_OPERATION),
                seed(
                        QuestionType.ADDITION,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADDITION_CHAIN,
                        QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MIN_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MAX_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.SUBTRACTION,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.SUBTRACTION_CHAIN,
                        QuestionTemplateSeedRules.MEDIUM_SUBTRACTION_CHAIN_MIN_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_SUBTRACTION_CHAIN_MAX_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.SUBTRACTION,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADD_SUBTRACT_CHAIN,
                        QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MIN_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_ADDITIVE_MAX_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.MULTIPLICATION,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN,
                        QuestionTemplateSeedRules.MEDIUM_MULTIPLICATION_CHAIN_MIN_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_MULTIPLICATION_CHAIN_MAX_VALUE,
                        QuestionTemplateSeedRules.MEDIUM_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(QuestionType.ORDER_OF_OPERATIONS, Difficulty.MEDIUM, QuestionGenerationPattern.ADD_THEN_MULTIPLY),
                seed(QuestionType.PARENTHESES, Difficulty.MEDIUM, QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY),
                seed(QuestionType.PARENTHESES, Difficulty.MEDIUM, QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM),

                seed(QuestionType.ADDITION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.SUBTRACTION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.MULTIPLICATION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(QuestionType.DIVISION, Difficulty.HARD, QuestionGenerationPattern.BINARY_OPERATION),
                seed(
                        QuestionType.ADDITION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.ADDITION_CHAIN,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.ADDITION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.LONG_ADDITION_CHAIN,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.SUBTRACTION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.SUBTRACTION_CHAIN,
                        QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.SUBTRACTION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN,
                        QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_SUBTRACTION_CHAIN_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.SUBTRACTION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.ADD_SUBTRACT_CHAIN,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.SUBTRACTION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_ADDITIVE_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(QuestionType.ORDER_OF_OPERATIONS, Difficulty.HARD, QuestionGenerationPattern.ADD_THEN_MULTIPLY),
                seed(QuestionType.ORDER_OF_OPERATIONS, Difficulty.HARD, QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT),
                seed(QuestionType.PARENTHESES, Difficulty.HARD, QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY),
                seed(QuestionType.PARENTHESES, Difficulty.HARD, QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM),
                seed(
                        QuestionType.MULTIPLICATION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN,
                        QuestionTemplateSeedRules.HARD_MULTIPLICATION_CHAIN_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_MULTIPLICATION_CHAIN_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
                ),
                seed(
                        QuestionType.DIVISION,
                        Difficulty.HARD,
                        QuestionGenerationPattern.DIVISION_CHAIN,
                        QuestionTemplateSeedRules.HARD_DIVISION_CHAIN_MIN_VALUE,
                        QuestionTemplateSeedRules.HARD_DIVISION_CHAIN_MAX_VALUE,
                        QuestionTemplateSeedRules.HARD_OPERATOR_CHAIN_TIME_LIMIT_SECONDS
                )
        );
    }

    private static MathQuestionTemplateSeed seed(
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern,
            int minValue,
            int maxValue,
            int timeLimitSeconds
    ) {
        return MathQuestionTemplateSeed.of(
                questionType,
                difficulty,
                generationPattern,
                minValue,
                maxValue,
                timeLimitSeconds,
                QuestionTemplateSeedRules.DEFAULT_CHOICES_COUNT
        );
    }

    private static MathQuestionTemplateSeed seed(
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        return MathQuestionTemplateSeed.of(
                questionType,
                difficulty,
                generationPattern,
                minValueForDifficulty(difficulty),
                maxValueForDifficulty(difficulty),
                timeLimitSecondsForDifficulty(difficulty),
                QuestionTemplateSeedRules.DEFAULT_CHOICES_COUNT
        );
    }

    private static int minValueForDifficulty(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> QuestionTemplateSeedRules.EASY_MIN_VALUE;
            case MEDIUM -> QuestionTemplateSeedRules.MEDIUM_MIN_VALUE;
            case HARD -> QuestionTemplateSeedRules.HARD_MIN_VALUE;
        };
    }

    private static int maxValueForDifficulty(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> QuestionTemplateSeedRules.EASY_MAX_VALUE;
            case MEDIUM -> QuestionTemplateSeedRules.MEDIUM_MAX_VALUE;
            case HARD -> QuestionTemplateSeedRules.HARD_MAX_VALUE;
        };
    }

    private static int timeLimitSecondsForDifficulty(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> QuestionTemplateSeedRules.EASY_TIME_LIMIT_SECONDS;
            case MEDIUM -> QuestionTemplateSeedRules.MEDIUM_TIME_LIMIT_SECONDS;
            case HARD -> QuestionTemplateSeedRules.HARD_TIME_LIMIT_SECONDS;
        };
    }
}
