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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.List;
import java.util.Random;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

    @ParameterizedTest
    @MethodSource("additiveExpressionPatternCases")
    void shouldGenerateAdditiveExpressionQuestion(
            QuestionGenerationPattern generationPattern,
            QuestionType questionType,
            Difficulty difficulty,
            MathExpressionPattern expressionPattern,
            List<MathOperator> expectedOperators,
            int expectedOperandsCount
    ) {
        QuestionPlan questionPlan = createQuestionPlan(
                questionType,
                difficulty,
                5,
                30,
                generationPattern
        );

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(questionType, result.getQuestionType());
        assertEquals(expressionPattern, result.getExpressionPattern());
        assertEquals(expectedOperators, result.getOperators());
        assertEquals(expectedOperandsCount, result.getOperands().size());
        assertEquals(
                expressionPattern.calculateCorrectAnswer(result.getOperands()),
                result.getCorrectAnswerValue()
        );
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.ADDITION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.MULTIPLICATION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.DIVISION_OPERATOR));

        if (expectedOperators.contains(MathOperator.SUBTRACTION)) {
            assertTrue(result.getQuestionText().contains(MathQuestionTextRules.SUBTRACTION_OPERATOR));
        } else {
            assertFalse(result.getQuestionText().contains(MathQuestionTextRules.SUBTRACTION_OPERATOR));
        }
    }

    @ParameterizedTest
    @MethodSource("subtractionExpressionPatternCases")
    void shouldGenerateSafeSubtractionChainQuestion(
            QuestionGenerationPattern generationPattern,
            Difficulty difficulty,
            MathExpressionPattern expressionPattern,
            int expectedOperandsCount
    ) {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.SUBTRACTION,
                difficulty,
                5,
                30,
                generationPattern
        );

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.SUBTRACTION, result.getQuestionType());
        assertEquals(expressionPattern, result.getExpressionPattern());
        assertEquals(expectedOperandsCount, result.getOperands().size());
        assertEquals(
                expressionPattern.calculateCorrectAnswer(result.getOperands()),
                result.getCorrectAnswerValue()
        );
        assertTrue(result.getCorrectAnswerValue() >= 0);
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.SUBTRACTION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.ADDITION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.MULTIPLICATION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.DIVISION_OPERATOR));
    }

    @Test
    void shouldGenerateWholeNumberDivisionChainQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.DIVISION,
                Difficulty.HARD,
                2,
                8,
                QuestionGenerationPattern.DIVISION_CHAIN
        );

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.DIVISION, result.getQuestionType());
        assertEquals(MathExpressionPattern.DIVISION_CHAIN, result.getExpressionPattern());
        assertEquals(List.of(MathOperator.DIVISION, MathOperator.DIVISION), result.getOperators());
        assertEquals(3, result.getOperands().size());
        assertEquals(
                result.getOperands().get(QuestionRules.FIRST_OPERAND_INDEX)
                        / result.getOperands().get(QuestionRules.SECOND_OPERAND_INDEX)
                        / result.getOperands().get(QuestionRules.THIRD_OPERAND_INDEX),
                result.getCorrectAnswerValue()
        );
        assertEquals(
                0,
                result.getOperands().get(QuestionRules.FIRST_OPERAND_INDEX)
                        % result.getOperands().get(QuestionRules.SECOND_OPERAND_INDEX)
        );
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.DIVISION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.ADDITION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.SUBTRACTION_OPERATOR));
        assertFalse(result.getQuestionText().contains(MathQuestionTextRules.MULTIPLICATION_OPERATOR));
    }

    @Test
    void shouldGenerateSmallMultiplicationChainForMediumDifficulty() {
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.MULTIPLICATION,
                Difficulty.MEDIUM,
                2,
                5,
                QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN
        );

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.MULTIPLICATION, result.getQuestionType());
        assertEquals(MathExpressionPattern.SMALL_MULTIPLICATION_CHAIN, result.getExpressionPattern());
        assertEquals(
                List.of(MathOperator.MULTIPLICATION, MathOperator.MULTIPLICATION),
                result.getOperators()
        );
        assertEquals(3, result.getOperands().size());
        assertEquals(
                MathExpressionPattern.SMALL_MULTIPLICATION_CHAIN.calculateCorrectAnswer(
                        result.getOperands()
                ),
                result.getCorrectAnswerValue()
        );
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

    @ParameterizedTest
    @EnumSource(
            value = QuestionGenerationPattern.class,
            names = {"BINARY_OPERATION"},
            mode = EnumSource.Mode.EXCLUDE
    )
    void shouldGenerateQuestionForEveryExpressionPattern(
            QuestionGenerationPattern generationPattern
    ) {
        QuestionPlan questionPlan = buildQuestionPlanFor(generationPattern);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertNotNull(result.getQuestionText());
        assertNotNull(result.getCorrectAnswerValue());
        assertEquals(questionTypeForPattern(generationPattern), result.getQuestionType());
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

    private QuestionPlan buildQuestionPlanFor(
            QuestionGenerationPattern generationPattern
    ) {
        return createQuestionPlan(
                questionTypeForPattern(generationPattern),
                difficultyForPattern(generationPattern),
                2,
                10,
                generationPattern
        );
    }

    private QuestionType questionTypeForPattern(
            QuestionGenerationPattern generationPattern
    ) {
        return switch (generationPattern) {
            case ADDITION_CHAIN,
                 LONG_ADDITION_CHAIN -> QuestionType.ADDITION;

            case SUBTRACTION_CHAIN,
                 LONG_SUBTRACTION_CHAIN,
                 ADD_SUBTRACT_CHAIN,
                 LONG_ADD_SUBTRACT_CHAIN -> QuestionType.SUBTRACTION;

            case DIVISION_CHAIN -> QuestionType.DIVISION;

            case ADD_THEN_MULTIPLY,
                 ADD_MULTIPLY_SUBTRACT -> QuestionType.ORDER_OF_OPERATIONS;

            case PARENTHESES_SUM_THEN_MULTIPLY,
                 MULTIPLY_BY_PARENTHESES_SUM -> QuestionType.PARENTHESES;

            case SMALL_MULTIPLICATION_CHAIN -> QuestionType.MULTIPLICATION;

            case BINARY_OPERATION -> QuestionType.ADDITION;
        };
    }

    private Difficulty difficultyForPattern(
            QuestionGenerationPattern generationPattern
    ) {
        return switch (generationPattern) {
            case LONG_ADDITION_CHAIN,
                 LONG_SUBTRACTION_CHAIN,
                 LONG_ADD_SUBTRACT_CHAIN,
                 ADD_MULTIPLY_SUBTRACT,
                 DIVISION_CHAIN -> Difficulty.HARD;

            case ADDITION_CHAIN,
                 SUBTRACTION_CHAIN,
                 ADD_SUBTRACT_CHAIN,
                 SMALL_MULTIPLICATION_CHAIN,
                 ADD_THEN_MULTIPLY,
                 PARENTHESES_SUM_THEN_MULTIPLY,
                 MULTIPLY_BY_PARENTHESES_SUM -> Difficulty.MEDIUM;

            case BINARY_OPERATION -> Difficulty.EASY;
        };
    }

    private static Stream<Arguments> subtractionExpressionPatternCases() {
        return Stream.of(
                Arguments.of(
                        QuestionGenerationPattern.SUBTRACTION_CHAIN,
                        Difficulty.MEDIUM,
                        MathExpressionPattern.SUBTRACTION_CHAIN,
                        3
                ),
                Arguments.of(
                        QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN,
                        Difficulty.HARD,
                        MathExpressionPattern.LONG_SUBTRACTION_CHAIN,
                        4
                )
        );
    }

    private static Stream<Arguments> additiveExpressionPatternCases() {
        return Stream.of(
                Arguments.of(
                        QuestionGenerationPattern.ADDITION_CHAIN,
                        QuestionType.ADDITION,
                        Difficulty.MEDIUM,
                        MathExpressionPattern.ADDITION_CHAIN,
                        List.of(MathOperator.ADDITION, MathOperator.ADDITION),
                        3
                ),
                Arguments.of(
                        QuestionGenerationPattern.LONG_ADDITION_CHAIN,
                        QuestionType.ADDITION,
                        Difficulty.HARD,
                        MathExpressionPattern.LONG_ADDITION_CHAIN,
                        List.of(
                                MathOperator.ADDITION,
                                MathOperator.ADDITION,
                                MathOperator.ADDITION
                        ),
                        4
                ),
                Arguments.of(
                        QuestionGenerationPattern.ADD_SUBTRACT_CHAIN,
                        QuestionType.SUBTRACTION,
                        Difficulty.MEDIUM,
                        MathExpressionPattern.ADD_SUBTRACT_CHAIN,
                        List.of(MathOperator.ADDITION, MathOperator.SUBTRACTION),
                        3
                ),
                Arguments.of(
                        QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN,
                        QuestionType.SUBTRACTION,
                        Difficulty.HARD,
                        MathExpressionPattern.LONG_ADD_SUBTRACT_CHAIN,
                        List.of(
                                MathOperator.ADDITION,
                                MathOperator.ADDITION,
                                MathOperator.SUBTRACTION
                        ),
                        4
                )
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
