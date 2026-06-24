package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MathQuestionGeneratorTest {

    private MathQuestionGenerator mathQuestionGenerator;

    @BeforeEach
    void setUp() {
        mathQuestionGenerator = new MathQuestionGenerator(new Random(1));
    }

    @Test
    void shouldGenerateAdditionQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.ADDITION, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.ADDITION, result.getQuestionType());
        assertEquals(MathExpressionPattern.BINARY_OPERATION, result.getExpressionPattern());
        assertEquals(List.of(MathOperator.ADDITION), result.getOperators());
        assertEquals(
                result.getLeftOperand() + result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
        assertEquals(QuestionRules.SIMPLE_BINARY_OPERANDS_COUNT, result.getOperands().size());
        assertTrue(result.getPreferredDistractorValues().isEmpty());
    }

    @Test
    void shouldGenerateNonNegativeSubtractionQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.SUBTRACTION, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.SUBTRACTION, result.getQuestionType());
        assertEquals(MathExpressionPattern.BINARY_OPERATION, result.getExpressionPattern());
        assertEquals(List.of(MathOperator.SUBTRACTION), result.getOperators());
        assertTrue(result.getCorrectAnswerValue() >= 0);
        assertTrue(result.getLeftOperand() >= result.getRightOperand());
        assertEquals(
                result.getLeftOperand() - result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
        assertEquals(QuestionRules.SIMPLE_BINARY_OPERANDS_COUNT, result.getOperands().size());
        assertTrue(result.getPreferredDistractorValues().isEmpty());
    }

    @Test
    void shouldGenerateMultiplicationQuestionOrChain() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.MULTIPLICATION, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.MULTIPLICATION, result.getQuestionType());

        if (result.getExpressionPattern() == MathExpressionPattern.BINARY_OPERATION) {
            assertEquals(QuestionRules.SIMPLE_BINARY_OPERANDS_COUNT, result.getOperands().size());
            assertEquals(List.of(MathOperator.MULTIPLICATION), result.getOperators());
            assertEquals(
                    result.getLeftOperand() * result.getRightOperand(),
                    result.getCorrectAnswerValue()
            );
        } else {
            assertEquals(MathExpressionPattern.MULTIPLICATION_CHAIN, result.getExpressionPattern());
            assertEquals(QuestionRules.COMPLEX_EXPRESSION_OPERANDS_COUNT, result.getOperands().size());
            assertEquals(
                    List.of(MathOperator.MULTIPLICATION, MathOperator.MULTIPLICATION),
                    result.getOperators()
            );

            int expectedCorrectAnswer = result.getOperands().stream()
                    .reduce(1, (left, right) -> left * right);

            assertEquals(expectedCorrectAnswer, result.getCorrectAnswerValue());
        }

        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.MULTIPLICATION_OPERATOR));
        assertTrue(result.getPreferredDistractorValues().isEmpty());
    }

    @Test
    void shouldGenerateWholeNumberDivisionQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.DIVISION, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.DIVISION, result.getQuestionType());
        assertEquals(MathExpressionPattern.BINARY_OPERATION, result.getExpressionPattern());
        assertEquals(List.of(MathOperator.DIVISION), result.getOperators());
        assertTrue(result.getRightOperand() >= 1 && result.getRightOperand() <= 10);
        assertTrue(result.getCorrectAnswerValue() >= 1 && result.getCorrectAnswerValue() <= 10);
        assertEquals(0, result.getLeftOperand() % result.getRightOperand());
        assertEquals(
                result.getLeftOperand() / result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
        assertEquals(QuestionRules.SIMPLE_BINARY_OPERANDS_COUNT, result.getOperands().size());
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.DIVISION_OPERATOR));
        assertTrue(result.getPreferredDistractorValues().isEmpty());
    }

    @Test
    void shouldGenerateOrderOfOperationsQuestionWithPreferredDistractor() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.ORDER_OF_OPERATIONS, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertTrue(result.getCorrectAnswerValue() >= QuestionRules.MIN_DISTRACTOR_VALUE);
        assertEquals(QuestionType.ORDER_OF_OPERATIONS, result.getQuestionType());
        assertFalse(result.getPreferredDistractorValues().isEmpty());

        if (result.getExpressionPattern() == MathExpressionPattern.ADD_THEN_MULTIPLY) {
            assertEquals(QuestionRules.COMPLEX_EXPRESSION_OPERANDS_COUNT, result.getOperands().size());
            assertEquals(
                    List.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION),
                    result.getOperators()
            );

            List<Integer> operands = result.getOperands();
            int expectedCorrectAnswer = operands.get(0) + operands.get(1) * operands.get(2);
            int expectedLeftToRightMistake = (operands.get(0) + operands.get(1)) * operands.get(2);

            assertEquals(expectedCorrectAnswer, result.getCorrectAnswerValue());
            assertTrue(result.getPreferredDistractorValues().contains(expectedLeftToRightMistake));
        } else {
            assertEquals(MathExpressionPattern.ADD_MULTIPLY_SUBTRACT, result.getExpressionPattern());
            assertEquals(
                    QuestionRules.MIXED_OPERATORS_EXPRESSION_OPERANDS_COUNT,
                    result.getOperands().size()
            );
            assertEquals(
                    List.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION, MathOperator.SUBTRACTION),
                    result.getOperators()
            );

            List<Integer> operands = result.getOperands();
            int expectedCorrectAnswer = operands.get(0)
                    + operands.get(1) * operands.get(2)
                    - operands.get(3);
            int expectedLeftToRightMistake = (operands.get(0) + operands.get(1))
                    * operands.get(2)
                    - operands.get(3);

            assertEquals(expectedCorrectAnswer, result.getCorrectAnswerValue());
            assertTrue(result.getPreferredDistractorValues().contains(expectedLeftToRightMistake));
        }

        assertFalse(result.getPreferredDistractorValues().contains(result.getCorrectAnswerValue()));
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.MULTIPLICATION_OPERATOR));
    }

    @Test
    void shouldGenerateParenthesesQuestionWithPreferredDistractor() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.PARENTHESES, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertTrue(result.getCorrectAnswerValue() >= QuestionRules.MIN_DISTRACTOR_VALUE);
        assertEquals(QuestionType.PARENTHESES, result.getQuestionType());
        assertEquals(QuestionRules.COMPLEX_EXPRESSION_OPERANDS_COUNT, result.getOperands().size());
        assertEquals(2, result.getOperators().size());
        assertFalse(result.getPreferredDistractorValues().isEmpty());

        List<Integer> operands = result.getOperands();

        if (result.getExpressionPattern() == MathExpressionPattern.PARENTHESES_SUM_THEN_MULTIPLY) {
            assertEquals(
                    List.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION),
                    result.getOperators()
            );

            int expectedCorrectAnswer = (operands.get(0) + operands.get(1)) * operands.get(2);
            int expectedIgnoreParenthesesMistake = operands.get(0) + operands.get(1) * operands.get(2);

            assertEquals(expectedCorrectAnswer, result.getCorrectAnswerValue());
            assertTrue(result.getPreferredDistractorValues().contains(expectedIgnoreParenthesesMistake));
        } else {
            assertEquals(MathExpressionPattern.MULTIPLY_BY_PARENTHESES_SUM, result.getExpressionPattern());
            assertEquals(
                    List.of(MathOperator.MULTIPLICATION, MathOperator.ADDITION),
                    result.getOperators()
            );

            int expectedCorrectAnswer = operands.get(0) * (operands.get(1) + operands.get(2));
            int expectedIgnoreParenthesesMistake = operands.get(0) * operands.get(1) + operands.get(2);

            assertEquals(expectedCorrectAnswer, result.getCorrectAnswerValue());
            assertTrue(result.getPreferredDistractorValues().contains(expectedIgnoreParenthesesMistake));
        }

        assertFalse(result.getPreferredDistractorValues().contains(result.getCorrectAnswerValue()));
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.OPEN_PARENTHESIS));
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.CLOSE_PARENTHESIS));
    }

    @Test
    void shouldThrowWhenQuestionPlanIsNull() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(null)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenQuestionTypeIsUnsupported() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.TEXT, 1, 10);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenRangeIsInvalid() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.ADDITION, 10, 1);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenDivisionRangeCannotAvoidZero() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.DIVISION, 0, 0);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenComplexExpressionRangeIsTooSmall() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.PARENTHESES, 0, 1);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    private QuestionPlan createQuestionPlan(
            QuestionType questionType,
            Integer minValue,
            Integer maxValue
    ) {
        return new QuestionPlan(
                createMathSubject(),
                questionType,
                Difficulty.EASY,
                minValue,
                maxValue,
                30,
                4,
                AdaptiveMode.BASIC,
                AssistanceLevel.NONE
        );
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode("MATH");
        subject.setName("Math");
        subject.setActive(true);
        return subject;
    }
}
