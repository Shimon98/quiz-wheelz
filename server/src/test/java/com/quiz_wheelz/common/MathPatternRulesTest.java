package com.quiz_wheelz.common;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MathPatternRulesTest {

    @Test
    void shouldAllowOnlyBinaryPatternForEasyDifficulty() {
        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.EASY,
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.EASY,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.EASY,
                QuestionGenerationPattern.ADDITION_CHAIN
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.EASY,
                QuestionGenerationPattern.SUBTRACTION_CHAIN
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.EASY,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        ));
    }

    @Test
    void shouldAllowControlledComplexPatternsForMediumDifficulty() {
        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADDITION_CHAIN
        ));

        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_SUBTRACT_CHAIN
        ));

        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.SUBTRACTION_CHAIN
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.LONG_ADDITION_CHAIN
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN
        ));

        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
        ));

        assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.DIVISION_CHAIN
        ));
    }

    @Test
    void shouldAllowAllControlledPatternsForHardDifficulty() {
        for (QuestionGenerationPattern generationPattern : QuestionGenerationPattern.values()) {
            assertTrue(MathPatternRules.isPatternAllowedForDifficulty(
                    Difficulty.HARD,
                    generationPattern
            ));
        }
    }

    @Test
    void shouldRejectMissingDifficultyOrPattern() {
        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                null,
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.EASY,
                null
        ));
    }

    @Test
    void shouldAllowQuestionTypeOnlyWhenItMatchesPattern() {
        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.ADDITION,
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.MULTIPLICATION,
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertFalse(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.PARENTHESES,
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.ADDITION,
                QuestionGenerationPattern.ADDITION_CHAIN
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.ADDITION,
                QuestionGenerationPattern.LONG_ADDITION_CHAIN
        ));

        assertFalse(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.SUBTRACTION,
                QuestionGenerationPattern.ADDITION_CHAIN
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.SUBTRACTION,
                QuestionGenerationPattern.SUBTRACTION_CHAIN
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.SUBTRACTION,
                QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN
        ));

        assertFalse(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.ADDITION,
                QuestionGenerationPattern.SUBTRACTION_CHAIN
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.SUBTRACTION,
                QuestionGenerationPattern.ADD_SUBTRACT_CHAIN
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.SUBTRACTION,
                QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN
        ));

        assertFalse(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.ADDITION,
                QuestionGenerationPattern.ADD_SUBTRACT_CHAIN
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.ORDER_OF_OPERATIONS,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertFalse(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.MULTIPLICATION,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.PARENTHESES,
                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.MULTIPLICATION,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        ));

        assertTrue(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.DIVISION,
                QuestionGenerationPattern.DIVISION_CHAIN
        ));

        assertFalse(MathPatternRules.isQuestionTypeAllowedForPattern(
                QuestionType.MULTIPLICATION,
                QuestionGenerationPattern.DIVISION_CHAIN
        ));
    }

    @Test
    void shouldReturnZeroOperatorCountForMissingValues() {
        assertEquals(
                MathPatternRules.NO_OPERATOR_COUNT,
                MathPatternRules.maxMultiplicationOperatorCount(
                        null,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                MathPatternRules.NO_OPERATOR_COUNT,
                MathPatternRules.maxDivisionOperatorCount(
                        QuestionType.DIVISION,
                        null
                )
        );
    }

    @Test
    void shouldLimitMultiplicationOperatorCountByPattern() {
        assertEquals(
                MathPatternRules.NO_OPERATOR_COUNT,
                MathPatternRules.maxMultiplicationOperatorCount(
                        QuestionType.ADDITION,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                MathPatternRules.SINGLE_OPERATOR_COUNT,
                MathPatternRules.maxMultiplicationOperatorCount(
                        QuestionType.MULTIPLICATION,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                MathPatternRules.SINGLE_OPERATOR_COUNT,
                MathPatternRules.maxMultiplicationOperatorCount(
                        QuestionType.ORDER_OF_OPERATIONS,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );

        assertEquals(
                MathPatternRules.SMALL_CHAIN_MULTIPLICATION_OPERATOR_COUNT,
                MathPatternRules.maxMultiplicationOperatorCount(
                        QuestionType.MULTIPLICATION,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
                )
        );
    }

    @Test
    void shouldLimitDivisionOperatorCountByPattern() {
        assertEquals(
                MathPatternRules.SINGLE_OPERATOR_COUNT,
                MathPatternRules.maxDivisionOperatorCount(
                        QuestionType.DIVISION,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                MathPatternRules.NO_OPERATOR_COUNT,
                MathPatternRules.maxDivisionOperatorCount(
                        QuestionType.ORDER_OF_OPERATIONS,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );

        assertEquals(
                MathPatternRules.NO_OPERATOR_COUNT,
                MathPatternRules.maxDivisionOperatorCount(
                        QuestionType.MULTIPLICATION,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
                )
        );

        assertEquals(
                MathPatternRules.DIVISION_CHAIN_OPERATOR_COUNT,
                MathPatternRules.maxDivisionOperatorCount(
                        QuestionType.DIVISION,
                        QuestionGenerationPattern.DIVISION_CHAIN
                )
        );
    }

    @Test
    void shouldAllowRepeatedMultiplicationForMediumAndHardSmallChain() {
        assertTrue(MathPatternRules.allowsRepeatedMultiplication(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        ));

        assertFalse(MathPatternRules.allowsRepeatedMultiplication(
                Difficulty.HARD,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.allowsRepeatedMultiplication(
                Difficulty.HARD,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        ));
    }

    @Test
    void shouldAllowRepeatedDivisionOnlyForDivisionChain() {
        assertFalse(MathPatternRules.allowsRepeatedDivision(
                Difficulty.EASY,
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertFalse(MathPatternRules.allowsRepeatedDivision(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertFalse(MathPatternRules.allowsRepeatedDivision(
                Difficulty.HARD,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        ));

        assertTrue(MathPatternRules.allowsRepeatedDivision(
                Difficulty.HARD,
                QuestionGenerationPattern.DIVISION_CHAIN
        ));
    }

    @Test
    void shouldUseLargerMultiplicationFactorForBinaryPatternOnly() {
        assertEquals(
                MathPatternRules.BINARY_MAX_MULTIPLICATION_FACTOR,
                MathPatternRules.maxMultiplicationFactor(
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                MathPatternRules.COMPLEX_MAX_MULTIPLICATION_FACTOR,
                MathPatternRules.maxMultiplicationFactor(
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );

        assertEquals(
                MathPatternRules.SMALL_CHAIN_MAX_MULTIPLICATION_FACTOR,
                MathPatternRules.maxMultiplicationFactor(
                        Difficulty.HARD,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
                )
        );
    }

    @Test
    void shouldReturnConfiguredDivisionFactorLimit() {
        assertEquals(
                MathPatternRules.MAX_DIVISION_FACTOR,
                MathPatternRules.maxDivisionFactor(
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                MathPatternRules.MAX_DIVISION_FACTOR,
                MathPatternRules.maxDivisionFactor(
                        Difficulty.HARD,
                        QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
                )
        );
    }

    @Test
    void shouldLimitCorrectAnswerValueByDifficultyAndPattern() {
        assertEquals(
                MathPatternRules.EASY_MAX_CORRECT_ANSWER_VALUE,
                MathPatternRules.maxCorrectAnswerValue(
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                MathPatternRules.MEDIUM_MAX_CORRECT_ANSWER_VALUE,
                MathPatternRules.maxCorrectAnswerValue(
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );

        assertEquals(
                MathPatternRules.HARD_MAX_CORRECT_ANSWER_VALUE,
                MathPatternRules.maxCorrectAnswerValue(
                        Difficulty.HARD,
                        QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
                )
        );

        assertEquals(
                MathPatternRules.SMALL_CHAIN_MAX_CORRECT_ANSWER_VALUE,
                MathPatternRules.maxCorrectAnswerValue(
                        Difficulty.HARD,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
                )
        );

        assertEquals(
                MathPatternRules.MEDIUM_MAX_CORRECT_ANSWER_VALUE,
                MathPatternRules.maxCorrectAnswerValue(
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
                )
        );
    }

    @Test
    void shouldIdentifyComplexPatterns() {
        assertFalse(MathPatternRules.isComplexPattern(
                QuestionGenerationPattern.BINARY_OPERATION
        ));

        assertTrue(MathPatternRules.isComplexPattern(
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.isComplexPattern(
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        ));
    }

    @Test
    void shouldIdentifyOrderOfOperationsPatterns() {
        assertTrue(MathPatternRules.usesOrderOfOperations(
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.usesOrderOfOperations(
                QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
        ));

        assertFalse(MathPatternRules.usesOrderOfOperations(
                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY
        ));
    }

    @Test
    void shouldIdentifyParenthesesPatterns() {
        assertTrue(MathPatternRules.usesParentheses(
                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY
        ));

        assertTrue(MathPatternRules.usesParentheses(
                QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM
        ));

        assertFalse(MathPatternRules.usesParentheses(
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        ));
    }

    @Test
    void shouldReturnOperatorsUsedByTemplate() {
        assertEquals(
                Set.of(MathOperator.ADDITION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.ADDITION,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                Set.of(MathOperator.SUBTRACTION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.SUBTRACTION,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                Set.of(MathOperator.MULTIPLICATION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.MULTIPLICATION,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                Set.of(MathOperator.DIVISION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.DIVISION,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertEquals(
                Set.of(MathOperator.ADDITION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.ADDITION,
                        QuestionGenerationPattern.ADDITION_CHAIN
                )
        );

        assertEquals(
                Set.of(MathOperator.ADDITION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.ADDITION,
                        QuestionGenerationPattern.LONG_ADDITION_CHAIN
                )
        );

        assertEquals(
                Set.of(MathOperator.SUBTRACTION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.SUBTRACTION,
                        QuestionGenerationPattern.SUBTRACTION_CHAIN
                )
        );

        assertEquals(
                Set.of(MathOperator.SUBTRACTION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.SUBTRACTION,
                        QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN
                )
        );

        assertEquals(
                Set.of(MathOperator.ADDITION, MathOperator.SUBTRACTION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.SUBTRACTION,
                        QuestionGenerationPattern.ADD_SUBTRACT_CHAIN
                )
        );

        assertEquals(
                Set.of(MathOperator.ADDITION, MathOperator.SUBTRACTION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.SUBTRACTION,
                        QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN
                )
        );

        assertEquals(
                Set.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.ORDER_OF_OPERATIONS,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );

        assertEquals(
                Set.of(
                        MathOperator.ADDITION,
                        MathOperator.MULTIPLICATION,
                        MathOperator.SUBTRACTION
                ),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.ORDER_OF_OPERATIONS,
                        QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT
                )
        );

        assertEquals(
                Set.of(MathOperator.MULTIPLICATION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.MULTIPLICATION,
                        QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
                )
        );

        assertEquals(
                Set.of(MathOperator.DIVISION),
                MathPatternRules.operatorsUsedByTemplate(
                        QuestionType.DIVISION,
                        QuestionGenerationPattern.DIVISION_CHAIN
                )
        );
    }

    @Test
    void shouldThrowWhenFactorRulesReceiveMissingValues() {
        assertThrows(
                IllegalArgumentException.class,
                () -> MathPatternRules.maxMultiplicationFactor(
                        null,
                        QuestionGenerationPattern.BINARY_OPERATION
                )
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> MathPatternRules.maxCorrectAnswerValue(
                        Difficulty.EASY,
                        null
                )
        );
    }

    @Test
    void shouldThrowWhenPatternIsNotAllowedForDifficulty() {
        assertThrows(
                IllegalArgumentException.class,
                () -> MathPatternRules.maxCorrectAnswerValue(
                        Difficulty.EASY,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );
    }
}
