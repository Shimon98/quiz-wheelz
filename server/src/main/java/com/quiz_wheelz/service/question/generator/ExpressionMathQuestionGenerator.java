package com.quiz_wheelz.service.question.generator;

import com.quiz_wheelz.common.MathPatternRules;
import com.quiz_wheelz.common.MathQuestionTextRules;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.question.MathOperandGenerator;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExpressionMathQuestionGenerator {

    private static final int SUBTRACTION_CHAIN_OPERANDS_COUNT = 3;
    private static final int LONG_SUBTRACTION_CHAIN_OPERANDS_COUNT = 4;

    private final MathOperandGenerator mathOperandGenerator;
    private final SafeSubtractionChainQuestionGenerator safeSubtractionChainQuestionGenerator;
    private final SafeDivisionChainQuestionGenerator safeDivisionChainQuestionGenerator;

    public ExpressionMathQuestionGenerator(
            MathOperandGenerator mathOperandGenerator,
            SafeSubtractionChainQuestionGenerator safeSubtractionChainQuestionGenerator,
            SafeDivisionChainQuestionGenerator safeDivisionChainQuestionGenerator
    ) {
        this.mathOperandGenerator = mathOperandGenerator;
        this.safeSubtractionChainQuestionGenerator = safeSubtractionChainQuestionGenerator;
        this.safeDivisionChainQuestionGenerator = safeDivisionChainQuestionGenerator;
    }

    public MathQuestionData generate(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern
    ) {
        if (expressionPattern == MathExpressionPattern.SUBTRACTION_CHAIN) {
            return buildExpressionQuestion(
                    questionPlan,
                    expressionPattern,
                    safeSubtractionChainQuestionGenerator.generate(
                            questionPlan,
                            expressionPattern,
                            SUBTRACTION_CHAIN_OPERANDS_COUNT
                    )
            );
        }

        if (expressionPattern == MathExpressionPattern.LONG_SUBTRACTION_CHAIN) {
            return buildExpressionQuestion(
                    questionPlan,
                    expressionPattern,
                    safeSubtractionChainQuestionGenerator.generate(
                            questionPlan,
                            expressionPattern,
                            LONG_SUBTRACTION_CHAIN_OPERANDS_COUNT
                    )
            );
        }

        if (expressionPattern == MathExpressionPattern.DIVISION_CHAIN) {
            return buildExpressionQuestion(
                    questionPlan,
                    expressionPattern,
                    safeDivisionChainQuestionGenerator.generate(
                            questionPlan,
                            expressionPattern
                    )
            );
        }

        return generateGenericExpressionQuestion(
                questionPlan,
                expressionPattern
        );
    }

    private MathQuestionData generateGenericExpressionQuestion(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern
    ) {
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
                        new ExpressionQuestionGenerationResult(
                                operands,
                                correctAnswer
                        )
                );
            }
        }

        throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
    }

    private MathQuestionData buildExpressionQuestion(
            QuestionPlan questionPlan,
            MathExpressionPattern expressionPattern,
            ExpressionQuestionGenerationResult generationResult
    ) {
        if (!isCorrectAnswerAllowed(questionPlan, generationResult.correctAnswer())) {
            throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
        }

        return new MathQuestionData(
                MathQuestionTextRules.buildExpressionQuestionText(
                        generationResult.operands(),
                        expressionPattern.getOperators(),
                        expressionPattern.getTextLayout()
                ),
                generationResult.correctAnswer(),
                first(generationResult.operands()),
                second(generationResult.operands()),
                questionPlan.getQuestionType(),
                expressionPattern,
                generationResult.operands(),
                expressionPattern.getOperators(),
                expressionPattern.calculatePreferredDistractorCandidates(
                        generationResult.operands()
                )
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

    private int first(List<Integer> operands) {
        return operands.get(QuestionRules.FIRST_OPERAND_INDEX);
    }

    private int second(List<Integer> operands) {
        return operands.get(QuestionRules.SECOND_OPERAND_INDEX);
    }
}
