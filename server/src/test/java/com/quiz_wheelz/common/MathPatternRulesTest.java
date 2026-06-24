package com.quiz_wheelz.common;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import org.junit.jupiter.api.Test;

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

        assertFalse(MathPatternRules.isPatternAllowedForDifficulty(
                Difficulty.MEDIUM,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
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
    }

    @Test
    void shouldAllowRepeatedMultiplicationOnlyForHardSmallChain() {
        assertFalse(MathPatternRules.allowsRepeatedMultiplication(
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
    void shouldNeverAllowRepeatedDivisionAtThisStage() {
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
