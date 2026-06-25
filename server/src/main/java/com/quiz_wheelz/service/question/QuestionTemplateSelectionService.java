package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathPatternRules;
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
                questionPlan.getDifficulty(),
                questionPlan.getGenerationPattern()
        );
    }

    @Transactional(readOnly = true)
    public QuestionTemplate selectTemplate(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty
    ) {
        return selectTemplate(
                subject,
                questionType,
                difficulty,
                QuestionGenerationPattern.BINARY_OPERATION
        );
    }

    @Transactional(readOnly = true)
    public QuestionTemplate selectTemplate(
            Subject subject,
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        validateSelectionInput(subject, questionType, difficulty, generationPattern);

        List<QuestionTemplate> templates =
                questionTemplateRepository
                        .findBySubjectAndTypeAndDifficultyAndGenerationPatternAndActiveTrueOrderByIdAsc(
                                subject,
                                questionType,
                                difficulty,
                                generationPattern
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
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        if (subject == null
                || questionType == null
                || difficulty == null
                || generationPattern == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        validatePatternCompatibility(questionType, difficulty, generationPattern);
    }

    private void validatePatternCompatibility(
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        if (generationPattern == QuestionGenerationPattern.BINARY_OPERATION) {
            if (!QuestionRules.isSupportedMathQuestionType(questionType)) {
                throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
            }

            return;
        }

        if (!MathPatternRules.isPatternAllowedForDifficulty(difficulty, generationPattern)
                || !MathPatternRules.isQuestionTypeAllowedForPattern(
                        questionType,
                        generationPattern
                )) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
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

        if (template.getMinValue() > template.getMaxValue()) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (template.getMinValue() < QuestionRules.MIN_DISTRACTOR_VALUE) {
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

        validatePatternCompatibility(
                template.getType(),
                template.getDifficulty(),
                template.getGenerationPattern()
        );
    }
}
