package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuestionGenerationService {

    private final QuestionTemplateSelectionService questionTemplateSelectionService;
    private final MathQuestionGenerator mathQuestionGenerator;
    private final AnswerChoiceGenerator answerChoiceGenerator;

    public QuestionGenerationService(
            QuestionTemplateSelectionService questionTemplateSelectionService,
            MathQuestionGenerator mathQuestionGenerator,
            AnswerChoiceGenerator answerChoiceGenerator
    ) {
        this.questionTemplateSelectionService = questionTemplateSelectionService;
        this.mathQuestionGenerator = mathQuestionGenerator;
        this.answerChoiceGenerator = answerChoiceGenerator;
    }

    @Transactional(readOnly = true)
    public InternalGeneratedQuestion generate(QuestionPlan questionPlan) {
        if (questionPlan == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        QuestionTemplate selectedTemplate =
                questionTemplateSelectionService.selectTemplate(questionPlan);

        QuestionPlan templateBackedQuestionPlan = buildQuestionPlanFromTemplate(
                selectedTemplate,
                questionPlan.getAdaptiveMode(),
                questionPlan.getAssistanceLevel()
        );

        MathQuestionData mathQuestionData =
                mathQuestionGenerator.generate(templateBackedQuestionPlan);

        List<InternalGeneratedQuestionChoice> choices =
                answerChoiceGenerator.generateChoices(
                        mathQuestionData,
                        templateBackedQuestionPlan.getChoicesCount()
                );

        return buildGeneratedQuestion(
                selectedTemplate,
                templateBackedQuestionPlan,
                mathQuestionData,
                choices
        );
    }

    private QuestionPlan buildQuestionPlanFromTemplate(
            QuestionTemplate questionTemplate,
            AdaptiveMode adaptiveMode,
            AssistanceLevel assistanceLevel
    ) {
        validateTemplateForGeneration(questionTemplate);

        return new QuestionPlan(
                questionTemplate.getSubject(),
                questionTemplate.getType(),
                questionTemplate.getDifficulty(),
                questionTemplate.getMinValue(),
                questionTemplate.getMaxValue(),
                questionTemplate.getTimeLimitSeconds(),
                questionTemplate.getChoicesCount(),
                questionTemplate.getGenerationPattern(),
                adaptiveMode,
                assistanceLevel
        );
    }

    private InternalGeneratedQuestion buildGeneratedQuestion(
            QuestionTemplate questionTemplate,
            QuestionPlan questionPlan,
            MathQuestionData mathQuestionData,
            List<InternalGeneratedQuestionChoice> choices
    ) {
        return new InternalGeneratedQuestion(
                questionTemplate.getSubject(),
                questionTemplate,
                questionPlan.getQuestionType(),
                questionPlan.getDifficulty(),
                mathQuestionData.getQuestionText(),
                mathQuestionData.getCorrectAnswerValue(),
                questionPlan.getTimeLimitSeconds(),
                choices
        );
    }

    private void validateTemplateForGeneration(QuestionTemplate questionTemplate) {
        if (questionTemplate == null
                || questionTemplate.getSubject() == null
                || questionTemplate.getType() == null
                || questionTemplate.getDifficulty() == null
                || questionTemplate.getMinValue() == null
                || questionTemplate.getMaxValue() == null
                || questionTemplate.getTimeLimitSeconds() == null
                || questionTemplate.getChoicesCount() == null
                || questionTemplate.getGenerationPattern() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}