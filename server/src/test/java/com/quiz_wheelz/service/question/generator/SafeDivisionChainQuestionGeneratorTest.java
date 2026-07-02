package com.quiz_wheelz.service.question.generator;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.MathExpressionPattern;
import com.quiz_wheelz.enums.MathOperandRole;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.service.question.MathOperandGenerator;
import com.quiz_wheelz.service.question.MathQuestionPlanValidator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SafeDivisionChainQuestionGeneratorTest {

    @Test
    void shouldRetryUntilDivisionChainAnswerIsAllowed() {
        MathQuestionPlanValidator mathQuestionPlanValidator =
                mock(MathQuestionPlanValidator.class);
        MathOperandGenerator mathOperandGenerator = mock(MathOperandGenerator.class);
        SafeDivisionChainQuestionGenerator generator =
                new SafeDivisionChainQuestionGenerator(
                        mathQuestionPlanValidator,
                        mathOperandGenerator
                );
        QuestionPlan questionPlan = createQuestionPlan();

        when(mathOperandGenerator.createOperands(
                eq(questionPlan),
                eq(MathOperandRole.DIVISION_FACTOR),
                eq(MathOperandRole.DIVISION_FACTOR),
                eq(MathOperandRole.DIVISION_FACTOR)
        ))
                .thenReturn(List.of(999, 2, 2))
                .thenReturn(List.of(10, 2, 2));

        ExpressionQuestionGenerationResult result = generator.generate(
                questionPlan,
                MathExpressionPattern.DIVISION_CHAIN
        );

        assertEquals(10, result.correctAnswer());
        assertEquals(List.of(40, 2, 2), result.operands());
        verify(mathOperandGenerator, times(2)).createOperands(
                eq(questionPlan),
                eq(MathOperandRole.DIVISION_FACTOR),
                eq(MathOperandRole.DIVISION_FACTOR),
                eq(MathOperandRole.DIVISION_FACTOR)
        );
    }

    private QuestionPlan createQuestionPlan() {
        return new QuestionPlan(
                createMathSubject(),
                QuestionType.DIVISION,
                Difficulty.HARD,
                1,
                10,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                QuestionRules.DEFAULT_CHOICES_COUNT,
                QuestionGenerationPattern.DIVISION_CHAIN,
                AdaptiveMode.BASIC,
                AssistanceLevel.NONE
        );
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode("MATH");
        subject.setName("Math");
        subject.setActive(true);
        return subject;
    }
}
