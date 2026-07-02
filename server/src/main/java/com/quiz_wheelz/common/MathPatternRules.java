package com.quiz_wheelz.common;

import com.quiz_wheelz.common.mathpattern.MathPatternCatalog;
import com.quiz_wheelz.common.mathpattern.MathPatternDefinition;
import com.quiz_wheelz.common.mathpattern.MathPatternOperatorResolver;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;

import java.util.Set;

public final class MathPatternRules {

    private static final String MISSING_MAX_ANSWER_VALUE_ERROR_MESSAGE =
            "Max correct answer value is not configured for the requested difficulty and pattern";

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

    private MathPatternRules() {
    }

    public static boolean isPatternAllowedForDifficulty(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        return difficulty != null
                && definition != null
                && definition.getAllowedDifficulties().contains(difficulty);
    }

    public static boolean isQuestionTypeAllowedForPattern(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        return questionType != null
                && definition != null
                && definition.getAllowedQuestionTypes().contains(questionType);
    }

    public static int maxMultiplicationOperatorCount(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        if (questionType == null || definition == null) {
            return NO_OPERATOR_COUNT;
        }

        return definition.getMaxMultiplicationOperatorCounts()
                .getOrDefault(questionType, NO_OPERATOR_COUNT);
    }

    public static int maxDivisionOperatorCount(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        if (questionType == null || definition == null) {
            return NO_OPERATOR_COUNT;
        }

        return definition.getMaxDivisionOperatorCounts()
                .getOrDefault(questionType, NO_OPERATOR_COUNT);
    }

    public static boolean allowsRepeatedMultiplication(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        return difficulty != null
                && definition != null
                && definition.getAllowedDifficulties().contains(difficulty)
                && definition.isRepeatedMultiplicationAllowed();
    }

    public static boolean allowsRepeatedDivision(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        return difficulty != null
                && definition != null
                && definition.getAllowedDifficulties().contains(difficulty)
                && definition.isRepeatedDivisionAllowed();
    }

    public static int maxMultiplicationFactor(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        return MathPatternCatalog.findRequired(difficulty, generationPattern)
                .getMaxMultiplicationFactor();
    }

    public static int maxDivisionFactor(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        return MathPatternCatalog.findRequired(difficulty, generationPattern)
                .getMaxDivisionFactor();
    }

    public static int maxCorrectAnswerValue(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternDefinition definition = MathPatternCatalog.findRequired(
                difficulty,
                generationPattern
        );

        Integer maxCorrectAnswerValue = definition.getMaxCorrectAnswerValuesByDifficulty()
                .get(difficulty);

        if (maxCorrectAnswerValue == null) {
            throw new IllegalArgumentException(MISSING_MAX_ANSWER_VALUE_ERROR_MESSAGE);
        }

        return maxCorrectAnswerValue;
    }

    public static boolean isComplexPattern(QuestionGenerationPattern generationPattern) {
        return generationPattern != null
                && generationPattern != QuestionGenerationPattern.BINARY_OPERATION;
    }

    public static boolean usesOrderOfOperations(QuestionGenerationPattern generationPattern) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        return definition != null && definition.isUsesOrderOfOperations();
    }

    public static boolean usesParentheses(QuestionGenerationPattern generationPattern) {
        MathPatternDefinition definition = MathPatternCatalog.find(generationPattern);

        return definition != null && definition.isUsesParentheses();
    }

    public static Set<MathOperator> operatorsUsedByTemplate(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        return MathPatternOperatorResolver.operatorsUsedByTemplate(
                questionType,
                generationPattern
        );
    }
}
