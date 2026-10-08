package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.answer.*;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.*;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

abstract class S4ExecutionIntegrationFixture extends S4ChallengeIntegrationFixture {
    @Autowired QuestionTemplateRepository templates;
    Long executionId;

    @BeforeEach
    void specialGeneration() {
        when(generation.generate(any())).thenAnswer(invocation -> {
            QuestionPlan plan = invocation.getArgument(0);
            var template = templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                    plan.getSubject(), plan.getDifficulty()).getFirst();
            return new InternalGeneratedQuestion(template.getSubject(), template, template.getType(),
                    template.getDifficulty(), "2 + 2", 4, template.getTimeLimitSeconds(),
                    List.of(new InternalGeneratedQuestionChoice("4", 4, true, 1),
                            new InternalGeneratedQuestionChoice("5", 5, false, 2),
                            new InternalGeneratedQuestionChoice("6", 6, false, 3),
                            new InternalGeneratedQuestionChoice("7", 7, false, 4)));
        });
    }

    void select(ChallengeChoice choice) {
        executionId = openOffer();
        choiceService.choose(secondRequest, new StudentChallengeChoiceRequest(executionId, choice.name()));
    }

    StudentQuestionResponse current() {
        return questions.getOrCreateCurrentQuestion(second());
    }

    SubmitAnswerResponse answer(boolean correct) {
        var question = current();
        Long answerId = transactions.execute(status -> questionRepository.findById(question.getQuestionId())
                .orElseThrow().getChoices().stream().filter(choice -> choice.isCorrect() == correct)
                .findFirst().orElseThrow().getId());
        var request = new SubmitAnswerRequest();
        request.setQuestionId(question.getQuestionId());
        request.setChoiceId(answerId);
        return answerService.submitAnswer(second(), request);
    }

    void normalGeneration() {
        allowGeneration();
        var plan = transactions.execute(status -> new QuestionPlan(locked().getRace().getSubject(),
                QuestionType.ADDITION, Difficulty.EASY, 1, 10, 30, 4, AdaptiveMode.OFF, AssistanceLevel.NONE));
        when(plans.buildQuestionPlan(any())).thenReturn(plan);
    }

    List<Object> learning() {
        var player = second();
        return List.of(player.getCurrentDifficulty(), player.getStreak(), player.getHighestStreak(),
                player.getCorrectAnswers(), player.getWrongAnswers(), player.getDifficultyCorrectStreak(),
                player.getDifficultyWrongStreak(), player.getSpeed(), energy());
    }
}
