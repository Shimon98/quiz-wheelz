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
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class MathQuestionGenerator {

    private static final Map<QuestionGenerationPattern, MathExpressionPattern>
            EXPRESSION_PATTERNS_BY_GENERATION_PATTERN = Map.ofEntries(
            Map.entry(
                    QuestionGenerationPattern.ADDITION_CHAIN,
                    MathExpressionPattern.ADDITION_CHAIN
            ),
            Map.entry(
                    QuestionGenerationPattern.LONG_ADDITION_CHAIN,
                    MathExpressionPattern.LONG_ADDITION_CHAIN
            ),
            Map.entry(
                    QuestionGenerationPattern.SUBTRACTION_CHAIN,
                    MathExpressionPattern.SUBTRACTION_CHAIN
            ),
            Map.entry(
                    QuestionGenerationPattern.LONG_SUBTRACTION_CHAIN,
                    MathExpressionPattern.LONG_SUBTRACTION_CHAIN
            ),
            Map.entry(
                    QuestionGenerationPattern.ADD_SUBTRACT_CHAIN,
                    MathExpressionPattern.ADD_SUBTRACT_CHAIN
            ),
            Map.entry(
                    QuestionGenerationPattern.LONG_ADD_SUBTRACT_CHAIN,
                    MathExpressionPattern.LONG_ADD_SUBTRACT_CHAIN
            ),
            Map.entry(
                    QuestionGenerationPattern.ADD_THEN_MULTIPLY,
                    MathExpressionPattern.ADD_THEN_MULTIPLY
            ),
            Map.entry(
                    QuestionGenerationPattern.PARENTHESES_SUM_THEN_MULTIPLY,
                    MathExpressionPattern.PARENTHESES_SUM_THEN_MULTIPLY
            ),
            Map.entry(
                    QuestionGenerationPattern.MULTIPLY_BY_PARENTHESES_SUM,
                    MathExpressionPattern.MULTIPLY_BY_PARENTHESES_SUM
            ),
            Map.entry(
                    QuestionGenerationPattern.ADD_MULTIPLY_SUBTRACT,
                    MathExpressionPattern.ADD_MULTIPLY_SUBTRACT
            ),
            Map.entry(
                    QuestionGenerationPattern.SMALL_MULTIPLICATION_CHAIN,
                    MathExpressionPattern.SMALL_MULTIPLICATION_CHAIN
            ),
            Map.entry(
                    QuestionGenerationPattern.DIVISION_CHAIN,
                    MathExpressionPattern.DIVISION_CHAIN
            )
    );

    private final MathQuestionPlanValidator mathQuestionPlanValidator;
    private final MathOperandGenerator mathOperandGenerator;

    public MathQuestionGenerator(
            MathQuestionPlanValidator mathQuestionPlanValidator,
            MathOperandGenerator mathOperandGenerator
    ) {
        this.mathQuestionPlanValidator = mathQuestionPlanValidator;
        this.mathOperandGenerator = mathOperandGenerator;
    }

    public MathQuestionData generate(QuestionPlan questionPlan) {
        mathQuestionPlanValidator.validate(questionPlan);

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

    private MathQuestionData generateExpressionQuestion(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern
    ) {
        if (expressionPattern == MathExpressionPattern.SUBTRACTION_CHAIN) {
            return generateSafeSubtractionChainQuestion(
                    questionPlan,
                    expressionPattern,
                    3
            );
        }

        if (expressionPattern == MathExpressionPattern.LONG_SUBTRACTION_CHAIN) {
            return generateSafeSubtractionChainQuestion(
                    questionPlan,
                    expressionPattern,
                    4
            );
        }

        if (expressionPattern == MathExpressionPattern.DIVISION_CHAIN) {
            return generateSafeDivisionChainQuestion(
                    questionPlan,
                    expressionPattern
            );
        }

        for (int attempt = 0;
             attempt < QuestionRules.MAX_QUESTION_GENERATION_ATTEMPTS;
             attempt++) {
            List<Integer> operands = mathOperandGenerator.createOperands(
                    questionPlan,
                    expressionPattern.getOperandRoles()
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

    private MathQuestionData generateSafeSubtractionChainQuestion(
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

    private MathQuestionData generateSafeDivisionChainQuestion(
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

    private List<MathOperandRole> subtractionChainRoles(int operandsCount) {
        return Collections.nCopies(
                operandsCount,
                MathOperandRole.ANY
        );
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
