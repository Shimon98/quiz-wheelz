package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionTemplateSelectionServiceTest {

    @Mock
    private QuestionTemplateRepository questionTemplateRepository;

    @InjectMocks
    private QuestionTemplateSelectionService questionTemplateSelectionService;

    @Test
    void shouldSelectActiveTemplateBySubjectTypeAndDifficulty() {
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

        when(questionTemplateRepository.findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY
        )).thenReturn(List.of(template));

        QuestionTemplate result = questionTemplateSelectionService.selectTemplate(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY
        );

        assertSame(template, result);
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

        when(questionTemplateRepository.findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                QuestionType.SUBTRACTION,
                Difficulty.EASY
        )).thenReturn(List.of(template));

        QuestionTemplate result = questionTemplateSelectionService.selectTemplate(questionPlan);

        assertSame(template, result);
    }

    @Test
    void shouldThrowWhenTemplateDoesNotExist() {
        Subject subject = createMathSubject();

        when(questionTemplateRepository.findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                QuestionType.MULTIPLICATION,
                Difficulty.MEDIUM
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

        when(questionTemplateRepository.findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY
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

        when(questionTemplateRepository.findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY
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

        when(questionTemplateRepository.findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY
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
        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(subject);
        template.setType(questionType);
        template.setDifficulty(difficulty);
        template.setMinValue(minValue);
        template.setMaxValue(maxValue);
        template.setTimeLimitSeconds(timeLimitSeconds);
        template.setChoicesCount(choicesCount);
        template.setActive(true);
        return template;
    }
}
