package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.luck.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import java.util.List;
import static org.mockito.Mockito.*;

@TestPropertySource(properties = "QUIZWHEELZ_LUCK_ANSWER_ENABLED=true")
@Import({FairLuckService.class, GuardShieldService.class, LuckTransactionGuard.class,
        LuckEffectResolver.class, LuckOwnStateReader.class, LuckPeerReader.class, LuckPeerJdbcResources.class, LuckDecisionSourceReader.class, RaceLuckFairnessStateService.class})
abstract class B1LuckIntegrationFixture extends S4ChallengeIntegrationFixture {
    @MockitoBean LuckRandomSource random;
    @MockitoSpyBean LuckPeerReader peers;
    @Autowired RacePlayerLuckDecisionRepository decisions;
    @Autowired RaceLuckFairnessStateRepository fairnessStates;

    @BeforeEach
    void prepareLuck() {
        when(random.nextDouble()).thenReturn(0.6);
        transactions.executeWithoutResult(status -> {
            var question = questionRepository.findById(questionId).orElseThrow();
            var wrong = new PlayerQuestionChoice();
            wrong.setPlayerQuestion(question);
            wrong.setChoiceText("3");
            wrong.setAnswerValue(3);
            wrong.setCorrect(false);
            wrong.setDisplayOrder(2);
            entityManager.persist(wrong);
        });
    }

    com.quiz_wheelz.dto.answer.SubmitAnswerResponse submit(boolean correct) {
        var request = request(correct);
        return answerService.submitAnswer(second(), request);
    }

    SubmitAnswerRequest request(boolean correct) {
        return transactions.execute(status -> {
            var question = questionRepository.findById(questionId).orElseThrow();
            var request = new SubmitAnswerRequest();
            request.setQuestionId(questionId);
            request.setChoiceId(question.getChoices().stream().filter(choice -> choice.isCorrect() == correct)
                    .findFirst().orElseThrow().getId());
            return request;
        });
    }

    void nextQuestion(long instant) {
        clock.set(instant);
        transactions.executeWithoutResult(status -> {
            var previous = questionRepository.findById(questionId).orElseThrow();
            var player = playerRepository.findById(secondId).orElseThrow();
            player.setMovementUpdatedAtEpochMs(instant);
            player.setLastSeenAt(local(instant));
            var question = new PlayerQuestion();
            question.setRacePlayer(player);
            question.setQuestionTemplate(previous.getQuestionTemplate());
            question.setQuestionText("1 + 1");
            question.setCorrectAnswerValue(2);
            question.setTimeLimitSeconds(30);
            question.setExpiresAt(local(instant + 30000));
            entityManager.persist(question);
            for (int index = 0; index < 2; index++) {
                var choice = new PlayerQuestionChoice();
                choice.setPlayerQuestion(question);
                choice.setChoiceText(index == 0 ? "2" : "3");
                choice.setAnswerValue(index == 0 ? 2 : 3);
                choice.setCorrect(index == 0);
                choice.setDisplayOrder(index + 1);
                entityManager.persist(choice);
            }
            questionId = question.getId();
        });
    }

    RacePlayerGameplayState gameplay() {
        return transactions.execute(status -> stateRepository.findByRacePlayerId(secondId).orElseThrow());
    }

    List<RacePlayerLuckDecision> history() {
        return transactions.execute(status -> decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(secondId));
    }

    Long effect(EffectType type, long start, long end) {
        return transactions.execute(status -> {
            var effect = new RacePlayerSpeedEffect();
            effect.setRacePlayer(playerRepository.findById(secondId).orElseThrow());
            effect.setType(type);
            effect.setSource(EffectSource.TURBO_FAILURE);
            effect.setMagnitudeTenths(1);
            effect.setStartsAtEpochMs(start);
            effect.setEndsAtEpochMs(end);
            return effectRepository.saveAndFlush(effect).getId();
        });
    }
}
