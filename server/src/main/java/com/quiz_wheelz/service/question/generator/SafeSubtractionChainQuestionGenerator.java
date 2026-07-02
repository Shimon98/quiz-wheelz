package com.quiz_wheelz.service.question.generator;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperandRole;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.question.MathOperandGenerator;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class SafeSubtractionChainQuestionGenerator {

    private final MathOperandGenerator mathOperandGenerator;

    public SafeSubtractionChainQuestionGenerator(MathOperandGenerator mathOperandGenerator) {
        this.mathOperandGenerator = mathOperandGenerator;
    }

    ExpressionQuestionGenerationResult generate(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern,
            int operandsCount
    ) {
        for (int attempt = 0;
             attempt < QuestionRules.MAX_QUESTION_GENERATION_ATTEMPTS;
             attempt++) {
            List<Integer> generatedValues = mathOperandGenerator.createOperands(
                    questionPlan,
                    subtractionChainRoles(operandsCount)
            );

            int targetAnswer = first(generatedValues);
            List<Integer> subtrahends = generatedValues.subList(
                    1,
                    generatedValues.size()
            );

            int leftOperand = targetAnswer + subtrahends.stream()
                    .mapToInt(Integer::intValue)
                    .sum();

            List<Integer> operands = new ArrayList<>();
            operands.add(leftOperand);
            operands.addAll(subtrahends);

            int correctAnswer = expressionPattern.calculateCorrectAnswer(operands);

            return new ExpressionQuestionGenerationResult(
                    operands,
                    correctAnswer
            );
        }

        throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
    }

    private List<MathOperandRole> subtractionChainRoles(int operandsCount) {
        return Collections.nCopies(
                operandsCount,
                MathOperandRole.ANY
        );
    }

    private int first(List<Integer> operands) {
        return operands.get(QuestionRules.FIRST_OPERAND_INDEX);
    }
}
