package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperandRole;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class MathQuestionGenerator {

    private static final List<MathExpressionPattern> MULTIPLICATION_PATTERNS = List.of(
            MathExpressionPattern.MULTIPLICATION_CHAIN
    );

    private static final List<MathExpressionPattern> ORDER_OF_OPERATIONS_PATTERNS = List.of(
            MathExpressionPattern.ADD_THEN_MULTIPLY,
            MathExpressionPattern.ADD_MULTIPLY_SUBTRACT
    );

    private static final List<MathExpressionPattern> PARENTHESES_PATTERNS = List.of(
            MathExpressionPattern.PARENTHESES_SUM_THEN_MULTIPLY,
            MathExpressionPattern.MULTIPLY_BY_PARENTHESES_SUM
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
        int firstValue = randomOperand(questionPlan, MathOperandRole.ANY);
        int secondValue = randomOperand(questionPlan, MathOperandRole.ANY);

        List<Integer> operands = List.of(
                Math.max(firstValue, secondValue),
                Math.min(firstValue, secondValue)
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
        if (random.nextBoolean()) {
            return generateExpressionQuestion(
                    questionPlan,
                    randomPattern(MULTIPLICATION_PATTERNS)
            );
        }

        return generateBinaryMultiplication(questionPlan);
    }

    private MathQuestionData generateBinaryMultiplication(QuestionPlan questionPlan) {
        List<Integer> operands = createOperands(
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
        validateDivisionRange(questionPlan);

        int divisor = randomOperand(questionPlan, MathOperandRole.DIVISION_FACTOR);
        int quotient = randomOperand(questionPlan, MathOperandRole.DIVISION_FACTOR);
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

        return generateExpressionQuestion(
                questionPlan,
                randomPattern(ORDER_OF_OPERATIONS_PATTERNS)
        );
    }

    private MathQuestionData generateParentheses(QuestionPlan questionPlan) {
        validateComplexExpressionRange(questionPlan);

        return generateExpressionQuestion(
                questionPlan,
                randomPattern(PARENTHESES_PATTERNS)
        );
    }

    private MathQuestionData generateExpressionQuestion(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern
    ) {
        for (int attempt = 0;
             attempt < QuestionRules.MAX_QUESTION_GENERATION_ATTEMPTS;
             attempt++) {
            List<Integer> operands = createOperands(
                    questionPlan,
                    expressionPattern.getOperandRoles()
            );

            int correctAnswer = expressionPattern.calculateCorrectAnswer(operands);

            if (correctAnswer >= QuestionRules.MIN_DISTRACTOR_VALUE) {
                return buildExpressionQuestion(
                        expressionPattern,
                        operands,
                        correctAnswer,
                        preferredDistractors(
                                correctAnswer,
                                expressionPattern.calculatePreferredDistractorCandidates(operands)
                        )
                );
            }
        }

        throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
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

    private MathQuestionData buildExpressionQuestion(
            MathExpressionPattern expressionPattern,
            List<Integer> operands,
            Integer correctAnswer,
            List<Integer> preferredDistractorValues
    ) {
        return new MathQuestionData(
                MathQuestionTextRules.buildExpressionQuestionText(
                        operands,
                        expressionPattern.getOperators(),
                        expressionPattern.getTextLayout()
                ),
                correctAnswer,
                first(operands),
                second(operands),
                expressionPattern.getQuestionType(),
                expressionPattern,
                operands,
                expressionPattern.getOperators(),
                preferredDistractorValues
        );
    }

    private List<Integer> createOperands(
            QuestionPlan questionPlan,
            MathOperandRole... operandRoles
    ) {
        List<Integer> operands = new ArrayList<>();

        for (MathOperandRole operandRole : operandRoles) {
            operands.add(randomOperand(questionPlan, operandRole));
        }

        return operands;
    }

    private List<Integer> createOperands(
            QuestionPlan questionPlan,
            List<MathOperandRole> operandRoles
    ) {
        List<Integer> operands = new ArrayList<>();

        for (MathOperandRole operandRole : operandRoles) {
            operands.add(randomOperand(questionPlan, operandRole));
        }

        return operands;
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

    private MathExpressionPattern randomPattern(List<MathExpressionPattern> expressionPatterns) {
        return expressionPatterns.get(random.nextInt(expressionPatterns.size()));
    }

    private List<Integer> preferredDistractors(
            Integer correctAnswer,
            List<Integer> candidates
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        List<Integer> distractors = new ArrayList<>();

        for (Integer candidate : candidates) {
            if (isValidPreferredDistractor(correctAnswer, candidate, distractors)) {
                distractors.add(candidate);
            }
        }

        return distractors;
    }

    private boolean isValidPreferredDistractor(
            Integer correctAnswer,
            Integer candidate,
            List<Integer> existingDistractors
    ) {
        return candidate != null
                && candidate >= QuestionRules.MIN_DISTRACTOR_VALUE
                && !candidate.equals(correctAnswer)
                && !existingDistractors.contains(candidate);
    }

    private int randomValue(Integer minValue, Integer maxValue) {
        return random.nextInt(maxValue - minValue + 1) + minValue;
    }

    private int first(List<Integer> operands) {
        return operands.get(QuestionRules.FIRST_OPERAND_INDEX);
    }

    private int second(List<Integer> operands) {
        return operands.get(QuestionRules.SECOND_OPERAND_INDEX);
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
}
