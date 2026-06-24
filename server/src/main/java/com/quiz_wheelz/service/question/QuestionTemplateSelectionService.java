package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuestionTemplateSelectionService {

    private final QuestionTemplateRepository questionTemplateRepository;

    public QuestionTemplateSelectionService(QuestionTemplateRepository questionTemplateRepository) {
        this.questionTemplateRepository = questionTemplateRepository;
    }

    @Transactional(readOnly = true)
    public QuestionTemplate selectTemplate(QuestionPlan questionPlan) {
        if (questionPlan == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        return selectTemplate(
                questionPlan.getSubject(),
                questionPlan.getQuestionType(),
                questionPlan.getDifficulty()
        );
    }

    @Transactional(readOnly = true)
    public QuestionTemplate selectTemplate(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty
    ) {
        validateSelectionInput(subject, questionType, difficulty);

        List<QuestionTemplate> templates =
                questionTemplateRepository.findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
                        subject,
                        questionType,
                        difficulty
                );

        if (templates.isEmpty()) {
            throw new ApiException(ErrorCode.QUESTION_TEMPLATE_NOT_FOUND);
        }

        QuestionTemplate selectedTemplate = templates.getFirst();
        validateTemplateConfig(selectedTemplate);

        return selectedTemplate;
    }

    private void validateSelectionInput(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty
    ) {
        if (subject == null || questionType == null || difficulty == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (!QuestionRules.isSupportedMathQuestionType(questionType)) {
            throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        }
    }

    private void validateTemplateConfig(QuestionTemplate template) {
        if (template == null
                || template.getMinValue() == null
                || template.getMaxValue() == null
                || template.getTimeLimitSeconds() == null
                || template.getChoicesCount() == null
                || template.getGenerationPattern() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (template.getGenerationPattern() != QuestionGenerationPattern.BINARY_OPERATION) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (template.getMinValue() > template.getMaxValue()) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (template.getChoicesCount() < QuestionRules.MIN_CHOICES_COUNT
                || template.getChoicesCount() > QuestionRules.MAX_CHOICES_COUNT) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (template.getTimeLimitSeconds() < QuestionRules.MIN_TIME_LIMIT_SECONDS
                || template.getTimeLimitSeconds() > QuestionRules.MAX_TIME_LIMIT_SECONDS) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (!QuestionRules.isSupportedMathQuestionType(template.getType())) {
            throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        }
    }
}
