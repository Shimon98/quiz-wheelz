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
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SafeSubtractionChainQuestionGeneratorTest {

    @Test
    void shouldRetryUntilSubtractionChainAnswerIsAllowed() {
        MathOperandGenerator mathOperandGenerator = mock(MathOperandGenerator.class);
        SafeSubtractionChainQuestionGenerator generator =
                new SafeSubtractionChainQuestionGenerator(mathOperandGenerator);
        QuestionPlan questionPlan = createQuestionPlan(
                QuestionType.SUBTRACTION,
                Difficulty.HARD,
                QuestionGenerationPattern.SUBTRACTION_CHAIN
        );

        when(mathOperandGenerator.createOperands(eq(questionPlan), anyList()))
                .thenReturn(List.of(999, 1, 1))
                .thenReturn(List.of(10, 2, 3));

        ExpressionQuestionGenerationResult result = generator.generate(
                questionPlan,
                MathExpressionPattern.SUBTRACTION_CHAIN,
                3
        );

        assertEquals(10, result.correctAnswer());
        assertEquals(List.of(15, 2, 3), result.operands());
        verify(mathOperandGenerator, times(2)).createOperands(
                eq(questionPlan),
                anyList()
        );
    }

    private QuestionPlan createQuestionPlan(
            QuestionType questionType,
            Difficulty difficulty,
            QuestionGenerationPattern generationPattern
    ) {
        return new QuestionPlan(
                createMathSubject(),
                questionType,
                difficulty,
                1,
                10,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                QuestionRules.DEFAULT_CHOICES_COUNT,
                generationPattern,
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
