package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathPatternRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathOperandRole;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class MathOperandGenerator {

    private final Random random;
    private final MathQuestionPlanValidator mathQuestionPlanValidator;

    @Autowired
    public MathOperandGenerator(MathQuestionPlanValidator mathQuestionPlanValidator) {
        this(new Random(), mathQuestionPlanValidator);
    }

    MathOperandGenerator(
            Random random,
            MathQuestionPlanValidator mathQuestionPlanValidator
    ) {
        this.random = random;
        this.mathQuestionPlanValidator = mathQuestionPlanValidator;
    }

    public List<Integer> createOperands(
            QuestionPlan questionPlan,
            MathOperandRole... operandRoles
    ) {
        validateInput(questionPlan, operandRoles);

        List<Integer> operands = new ArrayList<>();

        for (MathOperandRole operandRole : operandRoles) {
            operands.add(randomOperand(questionPlan, operandRole));
        }

        return operands;
    }

    public List<Integer> createOperands(
            QuestionPlan questionPlan,
            List<MathOperandRole> operandRoles
    ) {
        if (operandRoles == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        return createOperands(
                questionPlan,
                operandRoles.toArray(MathOperandRole[]::new)
        );
    }

    private void validateInput(
            QuestionPlan questionPlan,
            MathOperandRole... operandRoles
    ) {
        mathQuestionPlanValidator.validateOperandGenerationInput(questionPlan);

        if (operandRoles == null || operandRoles.length == 0) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        for (MathOperandRole operandRole : operandRoles) {
            if (operandRole == null) {
                throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
            }
        }
    }

    private int randomOperand(
            QuestionPlan questionPlan,
            MathOperandRole operandRole
    ) {
        return switch (operandRole) {
            case ANY -> randomValue(
                    questionPlan.getMinValue(),
                    questionPlan.getMaxValue()
            );

            case ADDEND -> randomValue(
                    Math.max(
                            QuestionRules.MIN_COMPLEX_EXPRESSION_ADDEND_VALUE,
                            questionPlan.getMinValue()
                    ),
                    questionPlan.getMaxValue()
            );

            case MULTIPLIER -> randomValue(
                    Math.max(
                            QuestionRules.MIN_COMPLEX_EXPRESSION_MULTIPLIER_VALUE,
                            questionPlan.getMinValue()
                    ),
                    maxMultiplierValue(questionPlan)
            );

            case DIVISION_FACTOR -> randomValue(
                    Math.max(
                            QuestionRules.MIN_DIVISION_FACTOR_VALUE,
                            questionPlan.getMinValue()
                    ),
                    questionPlan.getMaxValue()
            );
        };
    }

    private int maxMultiplierValue(QuestionPlan questionPlan) {
        mathQuestionPlanValidator.validateMultiplierRange(questionPlan);

        return Math.min(
                questionPlan.getMaxValue(),
                MathPatternRules.maxMultiplicationFactor(
                        questionPlan.getDifficulty(),
                        questionPlan.getGenerationPattern()
                )
        );
    }

    private int randomValue(Integer minValue, Integer maxValue) {
        if (minValue == null || maxValue == null || minValue > maxValue) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        return random.nextInt(maxValue - minValue + 1) + minValue;
    }
}