package com.quiz_wheelz.support;

import com.quiz_wheelz.service.question.AnswerChoiceGenerator;
import com.quiz_wheelz.service.question.MathOperandGenerator;
import com.quiz_wheelz.service.question.MathQuestionGenerator;
import com.quiz_wheelz.service.question.MathQuestionPlanValidator;
import com.quiz_wheelz.service.question.QuestionGenerationService;
import com.quiz_wheelz.service.question.QuestionTemplateFallbackService;
import com.quiz_wheelz.service.question.RacePlayerQuestionPlanService;
import com.quiz_wheelz.service.question.generator.BinaryMathQuestionGenerator;
import com.quiz_wheelz.service.question.generator.ExpressionMathQuestionGenerator;
import com.quiz_wheelz.service.question.generator.MathExpressionPatternResolver;
import com.quiz_wheelz.service.question.generator.SafeDivisionChainQuestionGenerator;
import com.quiz_wheelz.service.question.generator.SafeSubtractionChainQuestionGenerator;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;

@TestConfiguration(proxyBeanMethods = false)
@Import({RacePlayerQuestionPlanService.class, QuestionGenerationService.class, QuestionTemplateFallbackService.class,
        MathQuestionGenerator.class,
        MathQuestionPlanValidator.class, MathOperandGenerator.class, AnswerChoiceGenerator.class,
        BinaryMathQuestionGenerator.class, ExpressionMathQuestionGenerator.class, MathExpressionPatternResolver.class,
        SafeSubtractionChainQuestionGenerator.class, SafeDivisionChainQuestionGenerator.class})
public class QuestionGenerationConfiguration {
}
