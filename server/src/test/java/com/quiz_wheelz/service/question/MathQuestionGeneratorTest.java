package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.MathPatternRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MathQuestionGeneratorTest {

    private MathQuestionPlanValidator mathQuestionPlanValidator;
    private MathOperandGenerator mathOperandGenerator;
    private MathQuestionGenerator mathQuestionGenerator;

    @BeforeEach
    void setUp() {
        mathQuestionPlanValidator = new MathQuestionPlanValidator();
        mathOperandGenerator = new MathOperandGenerator(
                new Random(1),
                mathQuestionPlanValidator
        );
        mathQuestionGenerator = new MathQuestionGenerator(
                mathQuestionPlanValidator,
                mathOperandGenerator
        );
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
    void shouldGenerateBinaryMultiplicationQuestionOnly() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.MULTIPLICATION, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.MULTIPLICATION, result.getQuestionType());
        assertEquals(MathExpressionPattern.BINARY_OPERATION, result.getExpressionPattern());
        assertEquals(QuestionRules.SIMPLE_BINARY_OPERANDS_COUNT, result.getOperands().size());
        assertEquals(List.of(MathOperator.MULTIPLICATION), result.getOperators());
        assertEquals(
                result.getLeftOperand() * result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
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
    void shouldGenerateAddThenMultiplyQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                1,
                10,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.ORDER_OF_OPERATIONS, result.getQuestionType());
        assertEquals(MathExpressionPattern.ADD_THEN_MULTIPLY, result.getExpressionPattern());
        assertEquals(QuestionRules.COMPLEX_EXPRESSION_OPERANDS_COUNT, result.getOperands().size());
        assertEquals(
                List.of(MathOperator.ADDITION, MathOperator.MULTIPLICATION),
                result.getOperators()
        );

        int firstOperand = result.getOperands().get(QuestionRules.FIRST_OPERAND_INDEX);
        int secondOperand = result.getOperands().get(QuestionRules.SECOND_OPERAND_INDEX);
        int thirdOperand = result.getOperands().get(QuestionRules.THIRD_OPERAND_INDEX);

        assertEquals(
                firstOperand + secondOperand * thirdOperand,
                result.getCorrectAnswerValue()
        );

        assertTrue(secondOperand <= MathPatternRules.COMPLEX_MAX_MULTIPLICATION_FACTOR);
        assertTrue(thirdOperand <= MathPatternRules.COMPLEX_MAX_MULTIPLICATION_FACTOR);

        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.ADDITION_OPERATOR));
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.MULTIPLICATION_OPERATOR));
    }

    @Test
    void shouldGeneratePreferredDistractorForAddThenMultiplyQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                1,
                10,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        int firstOperand = result.getOperands().get(QuestionRules.FIRST_OPERAND_INDEX);
        int secondOperand = result.getOperands().get(QuestionRules.SECOND_OPERAND_INDEX);
        int thirdOperand = result.getOperands().get(QuestionRules.THIRD_OPERAND_INDEX);

        int leftToRightMistake = (firstOperand + secondOperand) * thirdOperand;

        assertTrue(result.getPreferredDistractorValues().contains(leftToRightMistake));
    }

    @Test
    void shouldRejectAddThenMultiplyForEasyDifficulty() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.EASY,
                1,
                10,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectAddThenMultiplyWithWrongQuestionType() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.MULTIPLICATION,
                Difficulty.MEDIUM,
                1,
                10,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectComplexQuestionWhenMultiplierRangeIsInvalid() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                1,
                1,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectParenthesesPatternUntilGeneratorSupportsIt() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.PARENTHESES,
                Difficulty.MEDIUM,
                1,
                10,
                QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenOrderOfOperationsIsNotSupportedInStageB() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.ORDER_OF_OPERATIONS, 1, 10);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenParenthesesIsNotSupportedInStageB() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.PARENTHESES, 1, 10);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> mathQuestionGenerator.generate(questionPlan)
        );

        assertEquals(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED, exception.getErrorCode());
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

    private QuestionPlan createQuestionPlan(
            QuestionType questionType,
            Integer minValue,
            Integer maxValue
    ) {
        return createQuestionPlan(
                questionType,
                Difficulty.EASY,
                minValue,
                maxValue,
                QuestionGenerationPattern.BINARY_OPERATION
        );
    }

    private QuestionPlan createQuestionPlan(
            QuestionType questionType,
            Difficulty difficulty,
            Integer minValue,
            Integer maxValue,
            QuestionGenerationPattern generationPattern
    ) {
        return new QuestionPlan(
                createMathSubject(),
                questionType,
                difficulty,
                minValue,
                maxValue,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                QuestionRules.DEFAULT_CHOICES_COUNT,
                generationPattern,
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
