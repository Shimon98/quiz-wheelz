package com.quiz_wheelz.service.question.generator;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathOperandRole;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.question.MathOperandGenerator;
import com.quiz_wheelz.service.question.MathQuestionPlanValidator;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BinaryMathQuestionGenerator {

    private final MathQuestionPlanValidator mathQuestionPlanValidator;
    private final MathOperandGenerator mathOperandGenerator;

    public BinaryMathQuestionGenerator(
            MathQuestionPlanValidator mathQuestionPlanValidator,
            MathOperandGenerator mathOperandGenerator
    ) {
        this.mathQuestionPlanValidator = mathQuestionPlanValidator;
        this.mathOperandGenerator = mathOperandGenerator;
    }

    public MathQuestionData generate(QuestionPlan questionPlan) {
        return switch (questionPlan.getQuestionType()) {
            case ADDITION -> generateAddition(questionPlan);
            case SUBTRACTION -> generateSubtraction(questionPlan);
            case MULTIPLICATION -> generateMultiplication(questionPlan);
            case DIVISION -> generateDivision(questionPlan);
            default -> throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        };
    }

    private MathQuestionData generateAddition(QuestionPlan questionPlan) {
        List<Integer> operands = mathOperandGenerator.createOperands(
                questionPlan,
                MathOperandRole.ANY,
                MathOperandRole.ANY
        );

        int correctAnswer = first(operands) + second(operands);

        return buildBinaryQuestion(
                QuestionType.ADDITION,
                operands,
                MathQuestionTextRules.ADDITION_OPERATOR,
                correctAnswer
        );
    }

    private MathQuestionData generateSubtraction(QuestionPlan questionPlan) {
        List<Integer> generatedOperands = mathOperandGenerator.createOperands(
                questionPlan,
                MathOperandRole.ANY,
                MathOperandRole.ANY
        );

        List<Integer> operands = List.of(
                Math.max(first(generatedOperands), second(generatedOperands)),
                Math.min(first(generatedOperands), second(generatedOperands))
        );

        int correctAnswer = first(operands) - second(operands);

        return buildBinaryQuestion(
                QuestionType.SUBTRACTION,
                operands,
                MathQuestionTextRules.SUBTRACTION_OPERATOR,
                correctAnswer
        );
    }

    private MathQuestionData generateMultiplication(QuestionPlan questionPlan) {
        List<Integer> operands = mathOperandGenerator.createOperands(
                questionPlan,
                MathOperandRole.ANY,
                MathOperandRole.ANY
        );

        int correctAnswer = first(operands) * second(operands);

        return buildBinaryQuestion(
                QuestionType.MULTIPLICATION,
                operands,
                MathQuestionTextRules.MULTIPLICATION_OPERATOR,
                correctAnswer
        );
    }

    private MathQuestionData generateDivision(QuestionPlan questionPlan) {
        mathQuestionPlanValidator.validateDivisionRange(questionPlan);

        List<Integer> divisionFactors = mathOperandGenerator.createOperands(
                questionPlan,
                MathOperandRole.DIVISION_FACTOR,
                MathOperandRole.DIVISION_FACTOR
        );

        int divisor = first(divisionFactors);
        int quotient = second(divisionFactors);
        int dividend = divisor * quotient;

        return buildBinaryQuestion(
                QuestionType.DIVISION,
                List.of(dividend, divisor),
                MathQuestionTextRules.DIVISION_OPERATOR,
                quotient
        );
    }

    private MathQuestionData buildBinaryQuestion(
            QuestionType questionType,
            List<Integer> operands,
            String operator,
            Integer correctAnswer
    ) {
        return new MathQuestionData(
                MathQuestionTextRules.buildBinaryQuestionText(
                        first(operands),
                        operator,
                        second(operands)
                ),
                correctAnswer,
                first(operands),
                second(operands),
                questionType
        );
    }

    private int first(List<Integer> operands) {
        return operands.get(QuestionRules.FIRST_OPERAND_INDEX);
    }

    private int second(List<Integer> operands) {
        return operands.get(QuestionRules.SECOND_OPERAND_INDEX);
    }
}
