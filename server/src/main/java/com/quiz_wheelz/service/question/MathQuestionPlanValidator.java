package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathPatternRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class MathQuestionPlanValidator {

    public void validate(QuestionPlan questionPlan) {
        validateRequiredFields(questionPlan);
        validateValueRange(questionPlan);

        if (questionPlan.getGenerationPattern() == QuestionGenerationPattern.BINARY_OPERATION) {
            validateBinaryQuestionPlan(questionPlan);
            return;
        }

        validateExpressionQuestionPlan(questionPlan);
    }

    public void validateDivisionRange(QuestionPlan questionPlan) {
        if (questionPlan.getMaxValue() < QuestionRules.MIN_DIVISION_FACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    public void validateMultiplierRange(QuestionPlan questionPlan) {
        int minMultiplierValue = Math.max(
                QuestionRules.MIN_COMPLEX_EXPRESSION_MULTIPLIER_VALUE,
                questionPlan.getMinValue()
        );

        int maxMultiplierValue = Math.min(
                questionPlan.getMaxValue(),
                MathPatternRules.maxMultiplicationFactor(
                        questionPlan.getDifficulty(),
                        questionPlan.getGenerationPattern()
                )
        );

        if (minMultiplierValue > maxMultiplierValue) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateRequiredFields(QuestionPlan questionPlan) {
        if (questionPlan == null
                || questionPlan.getQuestionType() == null
                || questionPlan.getDifficulty() == null
                || questionPlan.getMinValue() == null
                || questionPlan.getMaxValue() == null
                || questionPlan.getGenerationPattern() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateValueRange(QuestionPlan questionPlan) {
        if (questionPlan.getMinValue() > questionPlan.getMaxValue()) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (questionPlan.getMinValue() < QuestionRules.MIN_DISTRACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateBinaryQuestionPlan(QuestionPlan questionPlan) {
        if (!QuestionRules.isSupportedMathQuestionType(questionPlan.getQuestionType())) {
            throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        }
    }

    private void validateExpressionQuestionPlan(QuestionPlan questionPlan) {
        if (!MathPatternRules.isPatternAllowedForDifficulty(
                questionPlan.getDifficulty(),
                questionPlan.getGenerationPattern()
        )) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (!MathPatternRules.isQuestionTypeAllowedForPattern(
                questionPlan.getQuestionType(),
                questionPlan.getGenerationPattern()
        )) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
