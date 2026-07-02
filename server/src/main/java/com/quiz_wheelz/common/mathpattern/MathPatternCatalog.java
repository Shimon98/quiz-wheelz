package com.quiz_wheelz.common.mathpattern;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;

import java.util.Map;
import java.util.Set;

import static com.quiz_wheelz.common.mathpattern.MathPatternRuleConstants.*;

public final class MathPatternCatalog {

    private static final String MISSING_DIFFICULTY_OR_PATTERN_ERROR_MESSAGE =
            "Difficulty and generation pattern must not be null";

    private static final String PATTERN_NOT_ALLOWED_FOR_DIFFICULTY_ERROR_MESSAGE =
            "Generation pattern is not allowed for the requested difficulty";

    private static final Map<QuestionGenerationPattern, MathPatternDefinition> DEFINITIONS =
            createDefinitions();

    private MathPatternCatalog() {
    }

    public static MathPatternDefinition find(QuestionGenerationPattern generationPattern) {
        if (generationPattern == null) {
            return null;
        }

        return DEFINITIONS.get(generationPattern);
    }

    public static MathPatternDefinition findRequired(
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        if (difficulty == null || generationPattern == null) {
            throw new IllegalArgumentException(MISSING_DIFFICULTY_OR_PATTERN_ERROR_MESSAGE);
        }

        MathPatternDefinition definition = DEFINITIONS.get(generationPattern);

        if (definition == null || !definition.getAllowedDifficulties().contains(difficulty)) {
            throw new IllegalArgumentException(PATTERN_NOT_ALLOWED_FOR_DIFFICULTY_ERROR_MESSAGE);
        }

        return definition;
    }

    private static Map<QuestionGenerationPattern, MathPatternDefinition> createDefinitions() {
        return Map.ofEntries(
                Map.entry(
                        QuestionGenerationPattern.BINARY_OPERATION,
                        createBinaryOperationDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.ADDITION_CHAIN,
                        createAdditionChainDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.LONG_ADDITION_CHAIN,
                        createLongAdditionChainDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.SUBTRACTION_CHAIN,
                        createSubtractionChainDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN,
                        createLongSubtractionChainDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.ADD_SUBTRACT_CHAIN,
                        createAddSubtractChainDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN,
                        createLongAddSubtractChainDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY,
                        createAddThenMultiplyDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY,
                        createParenthesesDefinition(
                                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY
                        )
                ),
                Map.entry(
                        QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM,
                        createParenthesesDefinition(
                                QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM
                        )
                ),
                Map.entry(
                        QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT,
                        createAddMultiplySubtractDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN,
                        createSmallMultiplicationChainDefinition()
                ),
                Map.entry(
                        QuestionGenerationPattern.DIVISION_CHAIN,
                        createDivisionChainDefinition()
                )
        );
    }

    private static MathPatternDefinition createBinaryOperationDefinition() {
        return baseBuilder(QuestionGenerationPattern.BINARY_OPERATION)
                .allowedDifficulties(allDifficulties())
                .allowedQuestionTypes(QuestionRules.SUPPORTED_MATH_QUESTION_TYPES)
                .usedOperators(Set.of())
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
                .build();
    }

    private static MathPatternDefinition createAdditionChainDefinition() {
        return additiveBaseBuilder(QuestionGenerationPattern.ADDITION_CHAIN)
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(additionQuestionTypes())
                .usedOperators(Set.of(MathOperator.ADDITION))
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForMediumAndHard())
                .build();
    }

    private static MathPatternDefinition createLongAdditionChainDefinition() {
        return additiveBaseBuilder(QuestionGenerationPattern.LONG_ADDITION_CHAIN)
                .allowedDifficulties(hardDifficultyOnly())
                .allowedQuestionTypes(additionQuestionTypes())
                .usedOperators(Set.of(MathOperator.ADDITION))
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForHard())
                .build();
    }

    private static MathPatternDefinition createSubtractionChainDefinition() {
        return additiveBaseBuilder(QuestionGenerationPattern.SUBTRACTION_CHAIN)
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(subtractionQuestionTypes())
                .usedOperators(Set.of(MathOperator.SUBTRACTION))
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForMediumAndHard())
                .build();
    }

    private static MathPatternDefinition createLongSubtractionChainDefinition() {
        return additiveBaseBuilder(QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN)
                .allowedDifficulties(hardDifficultyOnly())
                .allowedQuestionTypes(subtractionQuestionTypes())
                .usedOperators(Set.of(MathOperator.SUBTRACTION))
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForHard())
                .build();
    }

    private static MathPatternDefinition createAddSubtractChainDefinition() {
        return additiveBaseBuilder(QuestionGenerationPattern.ADD_SUBTRACT_CHAIN)
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(subtractionQuestionTypes())
                .usedOperators(Set.of(MathOperator.ADDITION, MathOperator.SUBTRACTION))
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForMediumAndHard())
                .build();
    }

    private static MathPatternDefinition createLongAddSubtractChainDefinition() {
        return additiveBaseBuilder(QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN)
                .allowedDifficulties(hardDifficultyOnly())
                .allowedQuestionTypes(subtractionQuestionTypes())
                .usedOperators(Set.of(MathOperator.ADDITION, MathOperator.SUBTRACTION))
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForHard())
                .build();
    }

    private static MathPatternDefinition createAddThenMultiplyDefinition() {
        return baseBuilder(QuestionGenerationPattern.ADD_THEN_MULTIPLY)
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(orderOfOperationsQuestionTypes())
                .usedOperators(Set.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION))
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.ORDER_OF_OPERATIONS,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForMediumAndHard())
                .usesOrderOfOperations(true)
                .build();
    }

    private static MathPatternDefinition createParenthesesDefinition(
            QuestionGenerationPattern generationPattern
    ) {
        return baseBuilder(generationPattern)
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(parenthesesQuestionTypes())
                .usedOperators(Set.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION))
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.PARENTHESES,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForMediumAndHard())
                .usesParentheses(true)
                .build();
    }

    private static MathPatternDefinition createAddMultiplySubtractDefinition() {
        return baseBuilder(QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT)
                .allowedDifficulties(hardDifficultyOnly())
                .allowedQuestionTypes(orderOfOperationsQuestionTypes())
                .usedOperators(Set.of(
                        MathOperator.ADDITION,
                        MathOperator.MULTIPLICATION,
                        MathOperator.SUBTRACTION
                ))
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.ORDER_OF_OPERATIONS,
                        SINGLE_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForHard())
                .usesOrderOfOperations(true)
                .build();
    }

    private static MathPatternDefinition createSmallMultiplicationChainDefinition() {
        return baseBuilder(QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN)
                .allowedDifficulties(mediumAndHardDifficulties())
                .allowedQuestionTypes(multiplicationQuestionTypes())
                .usedOperators(Set.of(MathOperator.MULTIPLICATION))
                .maxMultiplicationOperatorCounts(operatorCountMap(
                        QuestionType.MULTIPLICATION,
                        SMALL_CHAIN_MULTIPLICATION_OPERATOR_COUNT
                ))
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(SMALL_CHAIN_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForSmallChainMediumAndHard())
                .repeatedMultiplicationAllowed(true)
                .build();
    }

    private static MathPatternDefinition createDivisionChainDefinition() {
        return baseBuilder(QuestionGenerationPattern.DIVISION_CHAIN)
                .allowedDifficulties(hardDifficultyOnly())
                .allowedQuestionTypes(divisionQuestionTypes())
                .usedOperators(Set.of(MathOperator.DIVISION))
                .maxMultiplicationOperatorCounts(emptyOperatorCounts())
                .maxDivisionOperatorCounts(operatorCountMap(
                        QuestionType.DIVISION,
                        DIVISION_CHAIN_OPERATOR_COUNT
                ))
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR)
                .maxCorrectAnswerValuesByDifficulty(maxAnswerValuesForHard())
                .repeatedDivisionAllowed(true)
                .build();
    }

    private static MathPatternDefinition.MathPatternDefinitionBuilder additiveBaseBuilder(
            QuestionGenerationPattern generationPattern
    ) {
        return baseBuilder(generationPattern)
                .maxMultiplicationOperatorCounts(emptyOperatorCounts())
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .maxMultiplicationFactor(COMPLEX_MAX_MULTIPLICATION_FACTOR)
                .maxDivisionFactor(MAX_DIVISION_FACTOR);
    }

    private static MathPatternDefinition.MathPatternDefinitionBuilder baseBuilder(
            QuestionGenerationPattern generationPattern
    ) {
        return MathPatternDefinition.builder()
                .generationPattern(generationPattern)
                .maxMultiplicationOperatorCounts(emptyOperatorCounts())
                .maxDivisionOperatorCounts(emptyOperatorCounts())
                .repeatedMultiplicationAllowed(false)
                .repeatedDivisionAllowed(false)
                .usesOrderOfOperations(false)
                .usesParentheses(false);
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

    private static Set<QuestionType> additionQuestionTypes() {
        return Set.of(QuestionType.ADDITION);
    }

    private static Set<QuestionType> subtractionQuestionTypes() {
        return Set.of(QuestionType.SUBTRACTION);
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

    private static Set<QuestionType> divisionQuestionTypes() {
        return Set.of(QuestionType.DIVISION);
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

    private static Map<Difficulty, Integer> maxAnswerValuesForSmallChainMediumAndHard() {
        return Map.of(
                Difficulty.MEDIUM,
                MEDIUM_MAX_CORRECT_ANSWER_VALUE,
                Difficulty.HARD,
                SMALL_CHAIN_MAX_CORRECT_ANSWER_VALUE
        );
    }
}
