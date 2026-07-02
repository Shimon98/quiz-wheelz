package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.MathQuestionData;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.service.question.generator.BinaryMathQuestionGenerator;
import com.quiz_wheelz.service.question.generator.ExpressionMathQuestionGenerator;
import com.quiz_wheelz.service.question.generator.MathExpressionPatternResolver;
import org.springframework.stereotype.Service;

@Service
public class MathQuestionGenerator {

    private final MathQuestionPlanValidator mathQuestionPlanValidator;
    private final BinaryMathQuestionGenerator binaryMathQuestionGenerator;
    private final ExpressionMathQuestionGenerator expressionMathQuestionGenerator;
    private final MathExpressionPatternResolver mathExpressionPatternResolver;

    public MathQuestionGenerator(
            MathQuestionPlanValidator mathQuestionPlanValidator,
            BinaryMathQuestionGenerator binaryMathQuestionGenerator,
            ExpressionMathQuestionGenerator expressionMathQuestionGenerator,
            MathExpressionPatternResolver mathExpressionPatternResolver
    ) {
        this.mathQuestionPlanValidator = mathQuestionPlanValidator;
        this.binaryMathQuestionGenerator = binaryMathQuestionGenerator;
        this.expressionMathQuestionGenerator = expressionMathQuestionGenerator;
        this.mathExpressionPatternResolver = mathExpressionPatternResolver;
    }

    public MathQuestionData generate(QuestionPlan questionPlan) {
        mathQuestionPlanValidator.validate(questionPlan);

        if (questionPlan.getGenerationPattern() == QuestionGenerationPattern.BINARY_OPERATION) {
            return binaryMathQuestionGenerator.generate(questionPlan);
        }

        MathExpressionPattern expressionPattern =
                mathExpressionPatternResolver.resolve(questionPlan.getGenerationPattern());

        return expressionMathQuestionGenerator.generate(
                questionPlan,
                expressionPattern
        );
    }
}
