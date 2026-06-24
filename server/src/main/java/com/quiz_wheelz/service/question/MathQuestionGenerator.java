package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperator;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.function.BiFunction;

@Service
public class MathQuestionGenerator {

    private static final List<MathOperator> MULTIPLICATION_CHAIN_OPERATORS = List.of(
            MathOperator.MULTIPLICATION,
            MathOperator.MULTIPLICATION
    );

    private static final List<MathOperator> ADD_THEN_MULTIPLY_OPERATORS = List.of(
            MathOperator.ADDITION,
            MathOperator.MULTIPLICATION
    );

    private static final List<MathOperator> ADD_MULTIPLY_SUBTRACT_OPERATORS = List.of(
            MathOperator.ADDITION,
            MathOperator.MULTIPLICATION,
            MathOperator.SUBTRACTION
    );

    private static final List<MathOperator> MULTIPLY_BY_PARENTHESES_SUM_OPERATORS = List.of(
            MathOperator.MULTIPLICATION,
            MathOperator.ADDITION
    );

    private final Random random;

    public MathQuestionGenerator() {
        this(new Random());
    }

    MathQuestionGenerator(Random random) {
        this.random = random;
    }

    public MathQuestionData generate(QuestionPlan questionPlan) {
        validateQuestionPlan(questionPlan);

        return switch (questionPlan.getQuestionType()) {
            case ADDITION -> generateAddition(questionPlan);
            case SUBTRACTION -> generateSubtraction(questionPlan);
            case MULTIPLICATION -> generateMultiplication(questionPlan);
            case DIVISION -> generateDivision(questionPlan);
            case ORDER_OF_OPERATIONS -> generateOrderOfOperations(questionPlan);
            case PARENTHESES -> generateParentheses(questionPlan);
            default -> throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        };
    }

    private MathQuestionData generateAddition(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
                questionPlan,
                OperandRole.ANY,
                OperandRole.ANY
        );

        int correctAnswer = operands.get(0) + operands.get(1);

        return buildBinaryQuestion(
                QuestionType.ADDITION,
                operands,
                MathQuestionTextRules.ADDITION_OPERATOR,
                correctAnswer
        );
    }

    private MathQuestionData generateSubtraction(QuestionPlan questionPlan) {
        int firstValue = randomOperand(questionPlan, OperandRole.ANY);
        int secondValue = randomOperand(questionPlan, OperandRole.ANY);

        List<Integer> operands = List.of(
                Math.max(firstValue, secondValue),
                Math.min(firstValue, secondValue)
        );

        int correctAnswer = operands.get(0) - operands.get(1);

        return buildBinaryQuestion(
                QuestionType.SUBTRACTION,
                operands,
                MathQuestionTextRules.SUBTRACTION_OPERATOR,
                correctAnswer
        );
    }

    private MathQuestionData generateMultiplication(QuestionPlan questionPlan) {
        if (random.nextBoolean()) {
            return generateMultiplicationChain(questionPlan);
        }

        return generateBinaryMultiplication(questionPlan);
    }

    private MathQuestionData generateBinaryMultiplication(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
                questionPlan,
                OperandRole.ANY,
                OperandRole.ANY
        );

        int correctAnswer = operands.get(0) * operands.get(1);

        return buildBinaryQuestion(
                QuestionType.MULTIPLICATION,
                operands,
                MathQuestionTextRules.MULTIPLICATION_OPERATOR,
                correctAnswer
        );
    }

    private MathQuestionData generateMultiplicationChain(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
                questionPlan,
                OperandRole.ANY,
                OperandRole.ANY,
                OperandRole.ANY
        );

        int correctAnswer = operands.get(0) * operands.get(1) * operands.get(2);

        return buildExpressionQuestion(
                QuestionType.MULTIPLICATION,
                MathExpressionPattern.MULTIPLICATION_CHAIN,
                operands,
                MULTIPLICATION_CHAIN_OPERATORS,
                correctAnswer,
                List.of(),
                MathQuestionTextRules::buildExpressionQuestionText
        );
    }

    private MathQuestionData generateDivision(QuestionPlan questionPlan) {
        validateDivisionRange(questionPlan);

        int divisor = randomOperand(questionPlan, OperandRole.DIVISION_FACTOR);
        int quotient = randomOperand(questionPlan, OperandRole.DIVISION_FACTOR);
        int dividend = divisor * quotient;

        return buildBinaryQuestion(
                QuestionType.DIVISION,
                List.of(dividend, divisor),
                MathQuestionTextRules.DIVISION_OPERATOR,
                quotient
        );
    }

    private MathQuestionData generateOrderOfOperations(QuestionPlan questionPlan) {
        validateComplexExpressionRange(questionPlan);

        if (random.nextBoolean()) {
            return generateAddMultiplySubtract(questionPlan);
        }

        return generateAddThenMultiply(questionPlan);
    }

    private MathQuestionData generateAddThenMultiply(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
                questionPlan,
                OperandRole.ADDEND,
                OperandRole.ANY,
                OperandRole.MULTIPLIER
        );

        int correctAnswer = operands.get(0) + operands.get(1) * operands.get(2);
        int leftToRightMistake = (operands.get(0) + operands.get(1)) * operands.get(2);

        return buildExpressionQuestion(
                QuestionType.ORDER_OF_OPERATIONS,
                MathExpressionPattern.ADD_THEN_MULTIPLY,
                operands,
                ADD_THEN_MULTIPLY_OPERATORS,
                correctAnswer,
                preferredDistractors(correctAnswer, leftToRightMistake),
                MathQuestionTextRules::buildExpressionQuestionText
        );
    }

    private MathQuestionData generateAddMultiplySubtract(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
                questionPlan,
                OperandRole.ADDEND,
                OperandRole.ANY,
                OperandRole.MULTIPLIER,
                OperandRole.ANY
        );

        int correctAnswer = operands.get(0)
                + operands.get(1) * operands.get(2)
                - operands.get(3);

        int leftToRightMistake = (operands.get(0) + operands.get(1))
                * operands.get(2)
                - operands.get(3);

        return buildExpressionQuestion(
                QuestionType.ORDER_OF_OPERATIONS,
                MathExpressionPattern.ADD_MULTIPLY_SUBTRACT,
                operands,
                ADD_MULTIPLY_SUBTRACT_OPERATORS,
                correctAnswer,
                preferredDistractors(correctAnswer, leftToRightMistake),
                MathQuestionTextRules::buildExpressionQuestionText
        );
    }

    private MathQuestionData generateParentheses(QuestionPlan questionPlan) {
        validateComplexExpressionRange(questionPlan);

        if (random.nextBoolean()) {
            return generateMultiplyByParenthesesSum(questionPlan);
        }

        return generateParenthesesSumThenMultiply(questionPlan);
    }

    private MathQuestionData generateParenthesesSumThenMultiply(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
                questionPlan,
                OperandRole.ADDEND,
                OperandRole.ANY,
                OperandRole.MULTIPLIER
        );

        int correctAnswer = (operands.get(0) + operands.get(1)) * operands.get(2);
        int ignoreParenthesesMistake = operands.get(0) + operands.get(1) * operands.get(2);

        return buildExpressionQuestion(
                QuestionType.PARENTHESES,
                MathExpressionPattern.PARENTHESES_SUM_THEN_MULTIPLY,
                operands,
                ADD_THEN_MULTIPLY_OPERATORS,
                correctAnswer,
                preferredDistractors(correctAnswer, ignoreParenthesesMistake),
                MathQuestionTextRules::buildParenthesesAroundFirstTwoOperandsQuestionText
        );
    }

    private MathQuestionData generateMultiplyByParenthesesSum(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
                questionPlan,
                OperandRole.MULTIPLIER,
                OperandRole.ANY,
                OperandRole.ADDEND
        );

        int correctAnswer = operands.get(0) * (operands.get(1) + operands.get(2));
        int ignoreParenthesesMistake = operands.get(0) * operands.get(1) + operands.get(2);

        return buildExpressionQuestion(
                QuestionType.PARENTHESES,
                MathExpressionPattern.MULTIPLY_BY_PARENTHESES_SUM,
                operands,
                MULTIPLY_BY_PARENTHESES_SUM_OPERATORS,
                correctAnswer,
                preferredDistractors(correctAnswer, ignoreParenthesesMistake),
                MathQuestionTextRules::buildParenthesesAroundLastTwoOperandsQuestionText
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
                        operands.get(0),
                        operator,
                        operands.get(1)
                ),
                correctAnswer,
                operands.get(0),
                operands.get(1),
                questionType
        );
    }

    private MathQuestionData buildExpressionQuestion(
            QuestionType questionType,
            MathExpressionPattern expressionPattern,
            List<Integer> operands,
            List<MathOperator> operators,
            Integer correctAnswer,
            List<Integer> preferredDistractorValues,
            BiFunction<List<Integer>, List<MathOperator>, String> questionTextBuilder
    ) {
        return new MathQuestionData(
                questionTextBuilder.apply(operands, operators),
                correctAnswer,
                operands.get(0),
                operands.get(1),
                questionType,
                expressionPattern,
                operands,
                operators,
                preferredDistractorValues
        );
    }

    private List<Integer> createOperands(
            QuestionPlan questionPlan,
            OperandRole... operandRoles
    ) {
        List<Integer> operands = new ArrayList<>();

        for (OperandRole operandRole : operandRoles) {
            operands.add(randomOperand(questionPlan, operandRole));
        }

        return operands;
    }

    private int randomOperand(
            QuestionPlan questionPlan,
            OperandRole operandRole
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
                    questionPlan.getMaxValue()
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

    private List<Integer> preferredDistractors(
            Integer correctAnswer,
            Integer... candidates
    ) {
        List<Integer> distractors = new ArrayList<>();

        for (Integer candidate : candidates) {
            if (candidate != null
                    && candidate >= QuestionRules.MIN_DISTRACTOR_VALUE
                    && !candidate.equals(correctAnswer)
                    && !distractors.contains(candidate)) {
                distractors.add(candidate);
            }
        }

        return distractors;
    }

    private int randomValue(Integer minValue, Integer maxValue) {
        return random.nextInt(maxValue - minValue + 1) + minValue;
    }

    private void validateQuestionPlan(QuestionPlan questionPlan) {
        if (questionPlan == null
                || questionPlan.getQuestionType() == null
                || questionPlan.getMinValue() == null
                || questionPlan.getMaxValue() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (!QuestionRules.isSupportedMathQuestionType(questionPlan.getQuestionType())) {
            throw new ApiException(ErrorCode.QUESTION_TYPE_NOT_SUPPORTED);
        }

        if (questionPlan.getMinValue() > questionPlan.getMaxValue()) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (questionPlan.getMinValue() < QuestionRules.MIN_DISTRACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateDivisionRange(QuestionPlan questionPlan) {
        if (questionPlan.getMaxValue() < QuestionRules.MIN_DIVISION_FACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateComplexExpressionRange(QuestionPlan questionPlan) {
        if (questionPlan.getMaxValue() < QuestionRules.MIN_COMPLEX_EXPRESSION_MULTIPLIER_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private enum OperandRole {
        ANY,
        ADDEND,
        MULTIPLIER,
        DIVISION_FACTOR
    }
}
