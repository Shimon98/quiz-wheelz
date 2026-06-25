package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.MathPatternRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperandRole;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class MathQuestionGenerator {

    private static final Map<QuestionGenerationPattern, MathExpressionPattern>
            EXPRESSION_PATTERNS_BY_GENERATION_PATTERN = Map.of(
            QuestionGenerationPattern.ADD_THEN_MULTIPLY,
            MathExpressionPattern.ADD_THEN_MULTIPLY
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

        if (questionPlan.getGenerationPattern() != QuestionGenerationPattern.BINARY_OPERATION) {
            return generateExpressionQuestion(
                    questionPlan,
                    resolveExpressionPattern(questionPlan.getGenerationPattern())
            );
        }

        return switch (questionPlan.getQuestionType()) {
            case ADDITION -> generateAddition(questionPlan);
            case SUBTRACTION -> generateSubtraction(questionPlan);
            case MULTIPLICATION -> generateMultiplication(questionPlan);
            case DIVISION -> generateDivision(questionPlan);
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

    private MathQuestionData generateExpressionQuestion(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern
    ) {
        for (int attempt = 0;
             attempt < QuestionRules.MAX_QUESTION_GENERATION_ATTEMPTS;
             attempt++) {
            List<Integer> operands = createOperands(
                    questionPlan,
                    expressionPattern.getOperandRoles().toArray(MathOperandRole[]::new)
            );

            int correctAnswer = expressionPattern.calculateCorrectAnswer(operands);

            if (isCorrectAnswerAllowed(questionPlan, correctAnswer)) {
                return buildExpressionQuestion(
                        questionPlan,
                        expressionPattern,
                        operands,
                        correctAnswer
                );
            }
        }

        throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
    }

    private MathQuestionData buildExpressionQuestion(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern,
            List<Integer> operands,
            Integer correctAnswer
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
                questionPlan.getQuestionType(),
                expressionPattern,
                operands,
                expressionPattern.getOperators(),
                expressionPattern.calculatePreferredDistractorCandidates(operands)
        );
    }

    private boolean isCorrectAnswerAllowed(
            QuestionPlan questionPlan,
            Integer correctAnswer
    ) {
        return correctAnswer != null
                && correctAnswer >= QuestionRules.MIN_DISTRACTOR_VALUE
                && correctAnswer <= MathPatternRules.maxCorrectAnswerValue(
                        questionPlan.getDifficulty(),
                        questionPlan.getGenerationPattern()
                );
    }

    private MathExpressionPattern resolveExpressionPattern(
            QuestionGenerationPattern generationPattern
    ) {
        MathExpressionPattern expressionPattern =
                EXPRESSION_PATTERNS_BY_GENERATION_PATTERN.get(generationPattern);

        if (expressionPattern == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        return expressionPattern;
    }

    private List<Integer> createOperands(QuestionPlan questionPlan, MathOperandRole... operandRoles) {
        List<Integer> operands = new ArrayList<>();

        for (MathOperandRole operandRole : operandRoles) {
            operands.add(randomOperand(questionPlan, operandRole));
        }

        return operands;
    }

    private int randomOperand(QuestionPlan questionPlan, MathOperandRole operandRole) {
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

        return maxMultiplierValue;
    }

    private int randomValue(Integer minValue, Integer maxValue) {
        if (minValue == null || maxValue == null || minValue > maxValue) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        return random.nextInt(maxValue - minValue + 1) + minValue;
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

    private void validateQuestionPlan(QuestionPlan questionPlan) {
        if (questionPlan == null
                || questionPlan.getQuestionType() == null
                || questionPlan.getDifficulty() == null
                || questionPlan.getMinValue() == null
                || questionPlan.getMaxValue() == null
                || questionPlan.getGenerationPattern() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (questionPlan.getMinValue() > questionPlan.getMaxValue()) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (questionPlan.getMinValue() < QuestionRules.MIN_DISTRACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (questionPlan.getGenerationPattern() == QuestionGenerationPattern.BINARY_OPERATION) {
            validateBinaryQuestionPlan(questionPlan);
            return;
        }

        validateExpressionQuestionPlan(questionPlan);
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

        if (!EXPRESSION_PATTERNS_BY_GENERATION_PATTERN.containsKey(
                questionPlan.getGenerationPattern()
        )) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateDivisionRange(QuestionPlan questionPlan) {
        if (questionPlan.getMaxValue() < QuestionRules.MIN_DIVISION_FACTOR_VALUE) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
