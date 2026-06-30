package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionTemplateSelectionServiceTest {

    @Mock
    private QuestionTemplateRepository questionTemplateRepository;

    @InjectMocks
    private QuestionTemplateSelectionService questionTemplateSelectionService;

    @Test
    void shouldSelectTemplateByGenerationPattern() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                20,
                30,
                4
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of(template));

        QuestionTemplate result = questionTemplateSelectionService.selectTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY
        );

        assertSame(template, result);
    }

    @Test
    void shouldSelectAddThenMultiplyTemplateWhenPatternMatches() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                1,
                20,
                30,
                4,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ORDER_OF_OPERATIONS,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )).thenReturn(List.of(template));

        QuestionTemplate result = questionTemplateSelectionService.selectTemplate(
                subject,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        assertSame(template, result);
    }

    @Test
    void shouldNotSelectBinaryTemplateWhenAddThenMultiplyWasRequested() {
        Subject subject = createMathSubject();
        QuestionTemplate binaryTemplate = createTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.MEDIUM,
                1,
                20,
                30,
                4
        );
        QuestionTemplate addThenMultiplyTemplate = createTemplate(
                subject,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                1,
                20,
                30,
                4,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ORDER_OF_OPERATIONS,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )).thenReturn(List.of(addThenMultiplyTemplate));

        QuestionTemplate result = questionTemplateSelectionService.selectTemplate(
                subject,
                QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.MEDIUM,
                QuestionGenerationPattern.ADD_THEN_MULTIPLY
        );

        assertSame(addThenMultiplyTemplate, result);
        verify(questionTemplateRepository)
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ORDER_OF_OPERATIONS,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                );
        verify(questionTemplateRepository, never())
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        binaryTemplate.getType(),
                        binaryTemplate.getDifficulty(),
                        binaryTemplate.getGenerationPattern()
                );
    }

    @Test
    void shouldSelectTemplateFromQuestionPlan() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.SUBTRACTION,
                Difficulty.EASY,
                1,
                20,
                30,
                4
        );

        QuestionPlan questionPlan = new QuestionPlan(
                subject,
                QuestionType.SUBTRACTION,
                Difficulty.EASY,
                1,
                20,
                30,
                4,
                AdaptiveMode.BASIC,
                AssistanceLevel.NONE
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.SUBTRACTION,
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of(template));

        QuestionTemplate result = questionTemplateSelectionService.selectTemplate(questionPlan);

        assertSame(template, result);
    }

    @Test
    void shouldThrowWhenTemplateDoesNotExist() {
        Subject subject = createMathSubject();

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.MULTIPLICATION,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.MULTIPLICATION,
                        Difficulty.MEDIUM
                )
        );

        assertEquals(ErrorCode.QUESTION_TEMPLATE_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenQuestionTypeIsNotSupported() {
        Subject subject = createMathSubject();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.TEXT,
                        Difficulty.EASY
                )
        );

        assertEquals(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED, exception.getErrorCode());
    }

    @Test
    void shouldRejectAddThenMultiplyForEasyDifficulty() {
        Subject subject = createMathSubject();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.ORDER_OF_OPERATIONS,
                        Difficulty.EASY,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectAddThenMultiplyWithWrongQuestionType() {
        Subject subject = createMathSubject();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.MULTIPLICATION,
                        Difficulty.MEDIUM,
                        QuestionGenerationPattern.ADD_THEN_MULTIPLY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenInputIsMissing() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        null,
                        QuestionType.ADDITION,
                        Difficulty.EASY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenQuestionPlanIsNull() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(null)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenTemplateRangeIsInvalid() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                50,
                10,
                30,
                4
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of(template));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldRejectTemplateWithNegativeMinValue() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                -1,
                20,
                30,
                4
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of(template));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenTemplateChoicesCountIsInvalid() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                20,
                30,
                1
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of(template));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenTemplateTimeLimitIsInvalid() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                20,
                3,
                4
        );

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of(template));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenTemplateGenerationPatternIsMissing() {
        Subject subject = createMathSubject();
        QuestionTemplate template = createTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                20,
                30,
                4
        );
        template.setGenerationPattern(null);

        when(questionTemplateRepository
                .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY,
                        QuestionGenerationPattern.BINARY_OPERATION
                )).thenReturn(List.of(template));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionTemplateSelectionService.selectTemplate(
                        subject,
                        QuestionType.ADDITION,
                        Difficulty.EASY
                )
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode("MATH");
        subject.setName("Math");
        subject.setActive(true);
        return subject;
    }

    private QuestionTemplate createTemplate(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty,
            Integer minValue,
            Integer maxValue,
            Integer timeLimitSeconds,
            Integer choicesCount
    ) {
        return createTemplate(
                subject,
                questionType,
                difficulty,
                minValue,
                maxValue,
                timeLimitSeconds,
                choicesCount,
                QuestionGenerationPattern.BINARY_OPERATION
        );
    }

    private QuestionTemplate createTemplate(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty,
            Integer minValue,
            Integer maxValue,
            Integer timeLimitSeconds,
            Integer choicesCount,
            QuestionGenerationPattern generationPattern
    ) {
        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(subject);
        template.setType(questionType);
        template.setDifficulty(difficulty);
        template.setGenerationPattern(generationPattern);
        template.setMinValue(minValue);
        template.setMaxValue(maxValue);
        template.setTimeLimitSeconds(timeLimitSeconds);
        template.setChoicesCount(choicesCount);
        template.setActive(true);
        return template;
    }
}
