package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.question.internal.*;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.service.question.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

abstract class S4ChallengeIntegrationFixture extends S4ChallengeFlowFixture {
    @MockitoBean RacePlayerQuestionPlanService plans;
    @MockitoBean QuestionGenerationService generation;

    @BeforeEach
    void specialGeneration() {
        when(generation.generateFromTemplate(any(), any(), any()))
                .thenAnswer(invocation -> generatedFrom(invocation.getArgument(0)));
    }

    private InternalGeneratedQuestion generatedFrom(QuestionTemplate template) {
        return new InternalGeneratedQuestion(template.getSubject(), template, template.getType(),
                template.getDifficulty(), "2 + 2", 4, template.getTimeLimitSeconds(),
                List.of(new InternalGeneratedQuestionChoice("4", 4, true, 1),
                        new InternalGeneratedQuestionChoice("5", 5, false, 2),
                        new InternalGeneratedQuestionChoice("6", 6, false, 3),
                        new InternalGeneratedQuestionChoice("7", 7, false, 4)));
    }

    void allowGeneration() {
        transactions.executeWithoutResult(status -> {
            var template = questionRepository.findById(questionId).orElseThrow().getQuestionTemplate();
            var generated = new InternalGeneratedQuestion(template.getSubject(), template,
                    QuestionType.ADDITION, Difficulty.EASY, "2 + 2", 4, 30,
                    List.of(new InternalGeneratedQuestionChoice("4", 4, true, 1),
                            new InternalGeneratedQuestionChoice("5", 5, false, 2),
                            new InternalGeneratedQuestionChoice("6", 6, false, 3),
                            new InternalGeneratedQuestionChoice("7", 7, false, 4)));
            org.mockito.Mockito.doReturn(List.of(template)).when(plans).templatesInTurn(any());
            org.mockito.Mockito.doReturn(generated).when(generation).generateFromTemplate(any(), any(), any());
        });
    }
}
