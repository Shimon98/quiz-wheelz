package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class QuestionTemplateFallbackService {

    private static final Logger LOGGER = LoggerFactory.getLogger(QuestionTemplateFallbackService.class);
    private static final Set<ErrorCode> TEMPLATE_FAILURES = Set.of(
            ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG,
            ErrorCode.QUESTION_TYPE_NOT_SUPPORTED,
            ErrorCode.QUESTION_GENERATION_FAILED
    );

    private final QuestionTemplateSelectionService questionTemplateSelectionService;
    private final QuestionGenerationService questionGenerationService;

    public QuestionTemplateFallbackService(
            QuestionTemplateSelectionService questionTemplateSelectionService,
            QuestionGenerationService questionGenerationService
    ) {
        this.questionTemplateSelectionService = questionTemplateSelectionService;
        this.questionGenerationService = questionGenerationService;
    }

    public Optional<InternalGeneratedQuestion> generateFromFirstUsable(List<QuestionTemplate> templates) {
        for (QuestionTemplate template : templates) {
            try {
                return Optional.of(questionGenerationService.generateFromTemplate(
                        template,
                        QuestionRules.DEFAULT_ADAPTIVE_MODE,
                        QuestionRules.DEFAULT_ASSISTANCE_LEVEL
                ));
            } catch (ApiException exception) {
                requireTemplateFailure(template, exception);
            }
        }

        return Optional.empty();
    }

    public boolean hasValidConfig(QuestionTemplate template) {
        try {
            questionTemplateSelectionService.validateTemplateConfig(template);
            return true;
        } catch (ApiException exception) {
            requireTemplateFailure(template, exception);
            return false;
        }
    }

    private static void requireTemplateFailure(QuestionTemplate template, ApiException exception) {
        if (!TEMPLATE_FAILURES.contains(exception.getErrorCode())) {
            throw exception;
        }

        LOGGER.debug("Question template {} skipped: {}", template.getId(), exception.getErrorCode());
    }
}
