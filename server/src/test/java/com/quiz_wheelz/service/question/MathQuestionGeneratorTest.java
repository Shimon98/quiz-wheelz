package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        assertEquals(
                result.getLeftOperand() + result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
        assertTrue(result.getLeftOperand() >= 1 && result.getLeftOperand() <= 10);
        assertTrue(result.getRightOperand() >= 1 && result.getRightOperand() <= 10);
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.ADDITION_OPERATOR));
    }

    @Test
    void shouldGenerateNonNegativeSubtractionQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.SUBTRACTION, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.SUBTRACTION, result.getQuestionType());
        assertTrue(result.getCorrectAnswerValue() >= 0);
        assertTrue(result.getLeftOperand() >= result.getRightOperand());
        assertEquals(
                result.getLeftOperand() - result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.SUBTRACTION_OPERATOR));
    }

    @Test
    void shouldGenerateMultiplicationQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.MULTIPLICATION, 2, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.MULTIPLICATION, result.getQuestionType());
        assertEquals(
                result.getLeftOperand() * result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
        assertTrue(result.getLeftOperand() >= 2 && result.getLeftOperand() <= 10);
        assertTrue(result.getRightOperand() >= 2 && result.getRightOperand() <= 10);
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.MULTIPLICATION_OPERATOR));
    }

    @Test
    void shouldGenerateWholeNumberDivisionQuestion() {
        QuestionPlan questionPlan = createQuestionPlan(QuestionType.DIVISION, 1, 10);

        MathQuestionData result = mathQuestionGenerator.generate(questionPlan);

        assertNotNull(result);
        assertEquals(QuestionType.DIVISION, result.getQuestionType());
        assertTrue(result.getRightOperand() >= 1 && result.getRightOperand() <= 10);
        assertTrue(result.getCorrectAnswerValue() >= 1 && result.getCorrectAnswerValue() <= 10);
        assertEquals(
                0,
                result.getLeftOperand() % result.getRightOperand()
        );
        assertEquals(
                result.getLeftOperand() / result.getRightOperand(),
                result.getCorrectAnswerValue()
        );
        assertTrue(result.getQuestionText().contains(MathQuestionTextRules.DIVISION_OPERATOR));
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
