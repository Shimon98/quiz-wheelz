package com.quiz_wheelz.service.question.generator;

import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MathExpressionPatternResolver {

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

    public MathExpressionPattern resolve(QuestionGenerationPattern generationPattern) {
        MathExpressionPattern expressionPattern =
                EXPRESSION_PATTERNS_BY_GENERATION_PATTERN.get(generationPattern);

        if (expressionPattern == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        return expressionPattern;
    }
}
