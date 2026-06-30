package com.quiz_wheelz.common;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;

import java.util.Map;
import java.util.Set;

public final class MathPatternRules {

    private static final String MISSING_DIFFICULTY_OR_PATTERN_ERROR_MESSAGE =
            "Difficulty and generation pattern must not be null";

    private static final String PATTERN_NOT_ALLOWED_FOR_DIFFICULTY_ERROR_MESSAGE =
            "Generation pattern is not allowed for the requested difficulty";

    private static final String MISSING_MAX_ANSWER_VALUE_ERROR_MESSAGE =
            "Max correct answer value is not configured for the requested difficulty and pattern";

    public static final int NO_OPERATOR_COUNT = 0;
    public static final int SINGLE_OPERATOR_COUNT = 1;
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

    private static final Map<QuestionGenerationPattern, MathPatternRule> PATTERN_RULES =
            createPatternRules();

    private MathPatternRules() {
    }

    public static boolean isPatternAllowedForDifficulty(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternRule rule = findRule(generationPattern);

        return difficulty != null
                && rule != null
                && rule.getAllowedDifficulties().contains(difficulty);
    }

    public static boolean isQuestionTypeAllowedForPattern(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternRule rule = findRule(generationPattern);

        return questionType != null
                && rule != null
                && rule.getAllowedQuestionTypes().contains(questionType);
    }

    public static int maxMultiplicationOperatorCount(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternRule rule = findRule(generationPattern);

        if (questionType == null || rule == null) {
            return NO_OPERATOR_COUNT;
        }

        return rule.getMaxMultiplicationOperatorCounts()
                .getOrDefault(questionType, NO_OPERATOR_COUNT);
    }

    public static int maxDivisionOperatorCount(
            QuestionType questionType,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternRule rule = findRule(generationPattern);

        if (questionType == null || rule == null) {
            return NO_OPERATOR_COUNT;
        }

        return rule.getMaxDivisionOperatorCounts()
                .getOrDefault(questionType, NO_OPERATOR_COUNT);
    }

    public static boolean allowsRepeatedMultiplication(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternRule rule = findRule(generationPattern);

        return difficulty != null
                && rule != null
                && rule.getAllowedDifficulties().contains(difficulty)
                && rule.isRepeatedMultiplicationAllowed();
    }

    public static boolean allowsRepeatedDivision(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternRule rule = findRule(generationPattern);

        return difficulty != null
                && rule != null
                && rule.getAllowedDifficulties().contains(difficulty)
                && rule.isRepeatedDivisionAllowed();
    }

    public static int maxMultiplicationFactor(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        return findRequiredRule(difficulty, generationPattern)
                .getMaxMultiplicationFactor();
    }

    public static int maxDivisionFactor(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        return findRequiredRule(difficulty, generationPattern)
                .getMaxDivisionFactor();
    }

    public static int maxCorrectAnswerValue(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        MathPatternRule rule = findRequiredRule(difficulty, generationPattern);

        Integer maxCorrectAnswerValue = rule.getMaxCorrectAnswerValuesByDifficulty()
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
        MathPatternRule rule = findRule(generationPattern);

        return rule != null && rule.isUsesOrderOfOperations();
    }

    public static boolean usesParentheses(QuestionGenerationPattern generationPattern) {
        MathPatternRule rule = findRule(generationPattern);

        return rule != null && rule.isUsesParentheses();
    }

    private static Map<QuestionGenerationPattern, MathPatternRule> createPatternRules() {
        return Map.of(
                QuestionGenerationPattern.BINARY_OPERATION,
                createBinaryOperationRule(),

                QuestionGenerationPattern.ADD_THEN_MULTIPLY,
                createAddThenMultiplyRule(),

                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY,
                createParenthesesRule(),

                QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM,
                createParenthesesRule(),

                QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT,
                createAddMultiplySubtractRule(),

                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN,
                createSmallMultiplicationChainRule()
        );
    }

    private static MathPatternRule createBinaryOperationRule() {
        return MathPatternRule.builder()
                .allowedDifficulties(allDifficulties())
                .allowedQuestionTypes(QuestionRules.SUPPORTED_MATH_QUESTION_TYPES)
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.MULTIPLICATION,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(operatorCountMap(
                        QuestionType.DIVISION,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxMultiplicationFactor(BINARY_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForAllDifficulties())
                .repeatedMultiplicationAllowed(false)
                .repeatedDivisionAllowed(false)
                .usesOrderOfOperations(false)
                .usesParentheses(false)
                .build();
    }

    private static MathPatternRule createAddThenMultiplyRule() {
        return MathPatternRule.builder()
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(orderOfOperationsQuestionTypes())
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.ORDER_OF_OPERATIONS,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForMediumAndHard())
                .repeatedMultiplicationAllowed(false)
                .repeatedDivisionAllowed(false)
                .usesOrderOfOperations(true)
                .usesParentheses(false)
                .build();
    }

    private static MathPatternRule createParenthesesRule() {
        return MathPatternRule.builder()
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(parenthesesQuestionTypes())
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.PARENTHESES,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForMediumAndHard())
                .repeatedMultiplicationAllowed(false)
                .repeatedDivisionAllowed(false)
                .usesOrderOfOperations(false)
                .usesParentheses(true)
                .build();
    }

    private static MathPatternRule createAddMultiplySubtractRule() {
        return MathPatternRule.builder()
                .allowedDifficulties(hardDifficultyOnly())
                .allowedQuestionTypes(orderOfOperationsQuestionTypes())
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.ORDER_OF_OPERATIONS,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForHard())
                .repeatedMultiplicationAllowed(false)
                .repeatedDivisionAllowed(false)
                .usesOrderOfOperations(true)
                .usesParentheses(false)
                .build();
    }

    private static MathPatternRule createSmallMultiplicationChainRule() {
        return MathPatternRule.builder()
                .allowedDifficulties(hardDifficultyOnly())
                .allowedQuestionTypes(multiplicationQuestionTypes())
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.MULTIPLICATION,
                        SMALL_CHAIN_MULTIPLICATION_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(SMALL_CHAIN_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForSmallChain())
                .repeatedMultiplicationAllowed(true)
                .repeatedDivisionAllowed(false)
                .usesOrderOfOperations(false)
                .usesParentheses(false)
                .build();
    }

    private static MathPatternRule findRule(QuestionGenerationPattern generationPattern) {
        if (generationPattern == null) {
            return null;
        }

        return PATTERN_RULES.get(generationPattern);
    }

    private static MathPatternRule findRequiredRule(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        if (difficulty == null || generationPattern == null) {
            throw new IllegalArgumentException(MISSING_DIFFICULTY_OR_PATTERN_ERROR_MESSAGE);
        }

        MathPatternRule rule = PATTERN_RULES.get(generationPattern);

        if (rule == null || !rule.getAllowedDifficulties().contains(difficulty)) {
            throw new IllegalArgumentException(PATTERN_NOT_ALLOWED_FOR_DIFFICULTY_ERROR_MESSAGE);
        }

        return rule;
    }

    private static Set<Difficulty> allDifficulties() {
        return Set.of(
                Difficulty.EASY,
                Difficulty.MEDIUM,
                Difficulty.HARD
        );
    }

    private static Set<Difficulty> mediumAndHardDifficulties() {
        return Set.of(
                Difficulty.MEDIUM,
                Difficulty.HARD
        );
    }

    private static Set<Difficulty> hardDifficultyOnly() {
        return Set.of(Difficulty.HARD);
    }

    private static Set<QuestionType> orderOfOperationsQuestionTypes() {
        return Set.of(QuestionType.ORDER_OF_OPERATIONS);
    }

    private static Set<QuestionType> parenthesesQuestionTypes() {
        return Set.of(QuestionType.PARENTHESES);
    }

    private static Set<QuestionType> multiplicationQuestionTypes() {
        return Set.of(QuestionType.MULTIPLICATION);
    }

    private static Map<QuestionType, Integer> operatorCountMap(
            QuestionType questionType,
            int operatorCount
    ) {
        return Map.of(questionType, operatorCount);
    }

    private static Map<QuestionType, Integer> emptyOperatorCounts() {
        return Map.of();
    }

    private static Map<Difficulty, Integer> maxAnswerValuesForAllDifficulties() {
        return Map.of(
                Difficulty.EASY,
                EASY_MAX_CORRECT_ANSWER_VALUE,
                Difficulty.MEDIUM,
                MEDIUM_MAX_CORRECT_ANSWER_VALUE,
                Difficulty.HARD,
                HARD_MAX_CORRECT_ANSWER_VALUE
        );
    }

    private static Map<Difficulty, Integer> maxAnswerValuesForMediumAndHard() {
        return Map.of(
                Difficulty.MEDIUM,
                MEDIUM_MAX_CORRECT_ANSWER_VALUE,
                Difficulty.HARD,
                HARD_MAX_CORRECT_ANSWER_VALUE
        );
    }

    private static Map<Difficulty, Integer> maxAnswerValuesForHard() {
        return Map.of(
                Difficulty.HARD,
                HARD_MAX_CORRECT_ANSWER_VALUE
        );
    }

    private static Map<Difficulty, Integer> maxAnswerValuesForSmallChain() {
        return Map.of(
                Difficulty.HARD,
                SMALL_CHAIN_MAX_CORRECT_ANSWER_VALUE
        );
    }
}
