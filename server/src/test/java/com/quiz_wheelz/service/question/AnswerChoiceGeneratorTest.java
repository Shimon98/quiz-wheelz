package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnswerChoiceGeneratorTest {

    private AnswerChoiceGenerator answerChoiceGenerator;

    @BeforeEach
    void setUp() {
        answerChoiceGenerator = new AnswerChoiceGenerator(new Random(1));
    }

    @Test
    void shouldGenerateRequestedNumberOfChoices() {
        MathQuestionData questionData = createQuestionData(12);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        assertNotNull(choices);
        assertEquals(QuestionRules.DEFAULT_CHOICES_COUNT, choices.size());
    }

    @Test
    void shouldIncludeExactlyOneCorrectChoice() {
        MathQuestionData questionData = createQuestionData(12);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        long correctChoicesCount = choices.stream()
                .filter(InternalGeneratedQuestionChoice::isCorrect)
                .count();

        assertEquals(1, correctChoicesCount);
        assertTrue(choices.stream().anyMatch(choice ->
                choice.isCorrect() && choice.getAnswerValue().equals(12)
        ));
    }

    @Test
    void shouldGenerateUniqueAnswerValues() {
        MathQuestionData questionData = createQuestionData(12);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        long uniqueAnswerValuesCount = choices.stream()
                .map(InternalGeneratedQuestionChoice::getAnswerValue)
                .distinct()
                .count();

        assertEquals(choices.size(), uniqueAnswerValuesCount);
    }

    @Test
    void shouldAssignDisplayOrderStartingAtOne() {
        MathQuestionData questionData = createQuestionData(12);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        for (int index = 0; index < choices.size(); index++) {
            assertEquals(
                    index + QuestionRules.FIRST_DISPLAY_ORDER,
                    choices.get(index).getDisplayOrder()
            );
        }
    }

    @Test
    void shouldUsePreferredDistractorsWhenValid() {
        MathQuestionData questionData = createQuestionDataWithPreferredDistractors(
                12,
                List.of(10, 14, 15)
        );

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        List<Integer> answerValues = choices.stream()
                .map(InternalGeneratedQuestionChoice::getAnswerValue)
                .toList();

        assertTrue(answerValues.contains(12));
        assertTrue(answerValues.contains(10));
        assertTrue(answerValues.contains(14));
        assertTrue(answerValues.contains(15));
    }

    @Test
    void shouldFilterInvalidPreferredDistractors() {
        MathQuestionData questionData = createQuestionDataWithPreferredDistractors(
                12,
                Arrays.asList(12, -1, 10, 10, null)
        );

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        List<Integer> answerValues = choices.stream()
                .map(InternalGeneratedQuestionChoice::getAnswerValue)
                .toList();

        assertEquals(QuestionRules.DEFAULT_CHOICES_COUNT, choices.size());
        assertTrue(answerValues.contains(12));
        assertTrue(answerValues.contains(10));

        long correctAnswerAppearances = answerValues.stream()
                .filter(value -> value.equals(12))
                .count();

        assertEquals(1, correctAnswerAppearances);
        assertTrue(answerValues.stream()
                .noneMatch(value -> value < QuestionRules.MIN_DISTRACTOR_VALUE));
    }

    @Test
    void shouldGenerateFallbackDistractorsForZeroCorrectAnswer() {
        MathQuestionData questionData = createQuestionData(0);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        assertEquals(QuestionRules.DEFAULT_CHOICES_COUNT, choices.size());
        assertTrue(choices.stream().anyMatch(choice ->
                choice.isCorrect() && choice.getAnswerValue().equals(0)
        ));
        assertTrue(choices.stream()
                .map(InternalGeneratedQuestionChoice::getAnswerValue)
                .allMatch(value -> value >= QuestionRules.MIN_DISTRACTOR_VALUE));
    }

    @Test
    void shouldKeepRandomDistractorsWithinConfiguredWindowForLargeCorrectAnswer() {
        MathQuestionData questionData = createQuestionData(100);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        );

        choices.stream()
                .filter(choice -> !choice.isCorrect())
                .map(InternalGeneratedQuestionChoice::getAnswerValue)
                .forEach(answerValue -> assertTrue(
                        Math.abs(answerValue - 100)
                                <= QuestionRules.MAX_DISTRACTOR_WINDOW + QuestionRules.MAX_CHOICES_COUNT
                ));
    }

    @Test
    void shouldSupportMinimumChoicesCount() {
        MathQuestionData questionData = createQuestionData(8);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.MIN_CHOICES_COUNT
        );

        assertEquals(QuestionRules.MIN_CHOICES_COUNT, choices.size());

        long correctChoicesCount = choices.stream()
                .filter(InternalGeneratedQuestionChoice::isCorrect)
                .count();

        assertEquals(1, correctChoicesCount);
    }

    @Test
    void shouldSupportMaximumChoicesCount() {
        MathQuestionData questionData = createQuestionData(8);

        List<InternalGeneratedQuestionChoice> choices = answerChoiceGenerator.generateChoices(
                questionData,
                QuestionRules.MAX_CHOICES_COUNT
        );

        assertEquals(QuestionRules.MAX_CHOICES_COUNT, choices.size());

        long uniqueAnswerValuesCount = choices.stream()
                .map(InternalGeneratedQuestionChoice::getAnswerValue)
                .distinct()
                .count();

        assertEquals(QuestionRules.MAX_CHOICES_COUNT, uniqueAnswerValuesCount);
    }

    @Test
    void shouldThrowWhenQuestionDataIsNull() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerChoiceGenerator.generateChoices(null, QuestionRules.DEFAULT_CHOICES_COUNT)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenCorrectAnswerIsMissing() {
        MathQuestionData questionData = createQuestionData(null);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerChoiceGenerator.generateChoices(questionData, QuestionRules.DEFAULT_CHOICES_COUNT)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenChoicesCountIsMissing() {
        MathQuestionData questionData = createQuestionData(12);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerChoiceGenerator.generateChoices(questionData, null)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenChoicesCountIsTooLow() {
        MathQuestionData questionData = createQuestionData(12);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerChoiceGenerator.generateChoices(
                        questionData,
                        QuestionRules.MIN_CHOICES_COUNT - 1
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenChoicesCountIsTooHigh() {
        MathQuestionData questionData = createQuestionData(12);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerChoiceGenerator.generateChoices(
                        questionData,
                        QuestionRules.MAX_CHOICES_COUNT + 1
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenCorrectAnswerIsNegative() {
        MathQuestionData questionData = createQuestionData(-1);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerChoiceGenerator.generateChoices(
                        questionData,
                        QuestionRules.DEFAULT_CHOICES_COUNT
                )
        );

        assertEquals(ErrorCode.QUESTION_GENERATION_FAILED, exception.getErrorCode());
    }

    private MathQuestionData createQuestionData(Integer correctAnswer) {
        return new MathQuestionData(
                "6 + 6 = ?",
                correctAnswer,
                6,
                6,
                QuestionType.ADDITION
        );
    }

    private MathQuestionData createQuestionDataWithPreferredDistractors(
            Integer correctAnswer,
            List<Integer> preferredDistractors
    ) {
        return new MathQuestionData(
                "6 + 6 = ?",
                correctAnswer,
                6,
                6,
                QuestionType.ADDITION,
                null,
                List.of(6, 6),
                List.of(),
                preferredDistractors
        );
    }
}
