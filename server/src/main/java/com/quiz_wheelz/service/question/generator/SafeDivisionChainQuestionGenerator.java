package com.quiz_wheelz.service.question.generator;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperandRole;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.question.MathOperandGenerator;
import com.quiz_wheelz.service.question.MathQuestionPlanValidator;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SafeDivisionChainQuestionGenerator {

    private final MathQuestionPlanValidator mathQuestionPlanValidator;
    private final MathOperandGenerator mathOperandGenerator;

    public SafeDivisionChainQuestionGenerator(
            MathQuestionPlanValidator mathQuestionPlanValidator,
            MathOperandGenerator mathOperandGenerator
    ) {
        this.mathQuestionPlanValidator = mathQuestionPlanValidator;
        this.mathOperandGenerator = mathOperandGenerator;
    }

    ExpressionQuestionGenerationResult generate(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern
    ) {
        mathQuestionPlanValidator.validateDivisionRange(questionPlan);

        for (int attempt = 0;
             attempt < QuestionRules.MAX_QUESTION_GENERATION_ATTEMPTS;
             attempt++) {
            List<Integer> generatedValues = mathOperandGenerator.createOperands(
                    questionPlan,
                    MathOperandRole.DIVISION_FACTOR,
                    MathOperandRole.DIVISION_FACTOR,
                    MathOperandRole.DIVISION_FACTOR
            );

            int quotient = first(generatedValues);
            int firstDivisor = second(generatedValues);
            int secondDivisor = third(generatedValues);

            int dividend = quotient * firstDivisor * secondDivisor;

            List<Integer> operands = List.of(
                    dividend,
                    firstDivisor,
                    secondDivisor
            );

            int correctAnswer = expressionPattern.calculateCorrectAnswer(operands);

            return new ExpressionQuestionGenerationResult(
                    operands,
                    correctAnswer
            );
        }

        throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
    }

    private int first(List<Integer> operands) {
        return operands.get(QuestionRules.FIRST_OPERAND_INDEX);
    }

    private int second(List<Integer> operands) {
        return operands.get(QuestionRules.SECOND_OPERAND_INDEX);
    }

    private int third(List<Integer> operands) {
        return operands.get(QuestionRules.THIRD_OPERAND_INDEX);
    }
}
