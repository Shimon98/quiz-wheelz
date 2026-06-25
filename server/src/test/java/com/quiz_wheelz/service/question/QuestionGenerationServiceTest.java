package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.dto.question.MathQuestionData;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionGenerationServiceTest {

    @Mock
    private QuestionTemplateSelectionService questionTemplateSelectionService;

    @Mock
    private MathQuestionGenerator mathQuestionGenerator;

    @Mock
    private AnswerChoiceGenerator answerChoiceGenerator;

    @InjectMocks
    private QuestionGenerationService questionGenerationService;

    @Test
    void shouldGenerateQuestionUsingSelectedTemplate() {
        Subject subject = createMathSubject();
        QuestionPlan requestPlan = createRequestPlan(subject);
        QuestionTemplate selectedTemplate = createTemplate(subject);

        MathQuestionData mathQuestionData = new MathQuestionData(
                "6 + 6 = ?",
                12,
                6,
                6,
                QuestionType.ADDITION
        );

        List<InternalGeneratedQuestionChoice> choices = List.of(
                new InternalGeneratedQuestionChoice("12", 12, true, 1),
                new InternalGeneratedQuestionChoice("10", 10, false, 2),
                new InternalGeneratedQuestionChoice("14", 14, false, 3),
                new InternalGeneratedQuestionChoice("15", 15, false, 4)
        );

        when(questionTemplateSelectionService.selectTemplate(requestPlan))
                .thenReturn(selectedTemplate);
        when(mathQuestionGenerator.generate(any(QuestionPlan.class)))
                .thenReturn(mathQuestionData);
        when(answerChoiceGenerator.generateChoices(
                mathQuestionData,
                QuestionRules.DEFAULT_CHOICES_COUNT
        )).thenReturn(choices);

        InternalGeneratedQuestion result = questionGenerationService.generate(requestPlan);

        assertSame(subject, result.getSubject());
        assertSame(selectedTemplate, result.getQuestionTemplate());
        assertEquals(QuestionType.ADDITION, result.getQuestionType());
        assertEquals(Difficulty.EASY, result.getDifficulty());
        assertEquals("6 + 6 = ?", result.getQuestionText());
        assertEquals(12, result.getCorrectAnswerValue());
        assertEquals(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS, result.getTimeLimitSeconds());
        assertSame(choices, result.getChoices());
    }

    @Test
    void shouldBuildGenerationPlanFromSelectedTemplate() {
        Subject subject = createMathSubject();
        QuestionPlan requestPlan = createRequestPlan(subject);
        QuestionTemplate selectedTemplate = createTemplate(subject);

        MathQuestionData mathQuestionData = new MathQuestionData(
                "6 + 6 = ?",
                12,
                6,
                6,
                QuestionType.ADDITION
        );

        when(questionTemplateSelectionService.selectTemplate(requestPlan))
                .thenReturn(selectedTemplate);
        when(mathQuestionGenerator.generate(any(QuestionPlan.class)))
                .thenReturn(mathQuestionData);
        when(answerChoiceGenerator.generateChoices(any(MathQuestionData.class), any()))
                .thenReturn(List.of(
                        new InternalGeneratedQuestionChoice("12", 12, true, 1),
                        new InternalGeneratedQuestionChoice("10", 10, false, 2),
                        new InternalGeneratedQuestionChoice("14", 14, false, 3),
                        new InternalGeneratedQuestionChoice("15", 15, false, 4)
                ));

        questionGenerationService.generate(requestPlan);

        ArgumentCaptor<QuestionPlan> questionPlanCaptor =
                ArgumentCaptor.forClass(QuestionPlan.class);

        verify(mathQuestionGenerator).generate(questionPlanCaptor.capture());

        QuestionPlan generatedPlan = questionPlanCaptor.getValue();

        assertSame(subject, generatedPlan.getSubject());
        assertEquals(selectedTemplate.getType(), generatedPlan.getQuestionType());
        assertEquals(selectedTemplate.getDifficulty(), generatedPlan.getDifficulty());
        assertEquals(selectedTemplate.getMinValue(), generatedPlan.getMinValue());
        assertEquals(selectedTemplate.getMaxValue(), generatedPlan.getMaxValue());
        assertEquals(selectedTemplate.getTimeLimitSeconds(), generatedPlan.getTimeLimitSeconds());
        assertEquals(selectedTemplate.getChoicesCount(), generatedPlan.getChoicesCount());
        assertEquals(selectedTemplate.getGenerationPattern(), generatedPlan.getGenerationPattern());
        assertEquals(requestPlan.getAdaptiveMode(), generatedPlan.getAdaptiveMode());
        assertEquals(requestPlan.getAssistanceLevel(), generatedPlan.getAssistanceLevel());
    }

    @Test
    void shouldThrowWhenQuestionPlanIsNull() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionGenerationService.generate(null)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    @Test
    void shouldThrowWhenSelectedTemplateIsInvalid() {
        Subject subject = createMathSubject();
        QuestionPlan requestPlan = createRequestPlan(subject);

        when(questionTemplateSelectionService.selectTemplate(requestPlan))
                .thenReturn(null);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> questionGenerationService.generate(requestPlan)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    private QuestionPlan createRequestPlan(Subject subject) {
        return new QuestionPlan(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                10,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                QuestionRules.DEFAULT_CHOICES_COUNT,
                QuestionGenerationPattern.BINARY_OPERATION,
                AdaptiveMode.BASIC,
                AssistanceLevel.NONE
        );
    }

    private QuestionTemplate createTemplate(Subject subject) {
        QuestionTemplate questionTemplate = new QuestionTemplate();
        questionTemplate.setSubject(subject);
        questionTemplate.setType(QuestionType.ADDITION);
        questionTemplate.setDifficulty(Difficulty.EASY);
        questionTemplate.setGenerationPattern(QuestionGenerationPattern.BINARY_OPERATION);
        questionTemplate.setMinValue(1);
        questionTemplate.setMaxValue(10);
        questionTemplate.setTimeLimitSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS);
        questionTemplate.setChoicesCount(QuestionRules.DEFAULT_CHOICES_COUNT);
        questionTemplate.setActive(true);

        return questionTemplate;
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);

        return subject;
    }
}