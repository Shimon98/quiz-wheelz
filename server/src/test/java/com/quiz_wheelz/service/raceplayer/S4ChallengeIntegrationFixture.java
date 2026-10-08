package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.question.internal.*;
import com.quiz_wheelz.dto.raceplayer.*;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.challenge.*;
import com.quiz_wheelz.service.question.*;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@Import({ChallengeQuestionDeliveryService.class, ChallengeQuestionPlanService.class, StudentChallengeChoiceService.class, StudentRaceStateService.class,
        StudentQuestionDeliveryService.class, PlayerQuestionPersistenceService.class,
        StudentQuestionResponseMapper.class, RacePlayerReconnectService.class, RacePlayerDisconnectService.class})
abstract class S4ChallengeIntegrationFixture extends RaceChronologyIntegrationFixture {
    @Autowired ChallengeOfferService offers;
    @Autowired RacePlayerGameplayStateService stateService;
    @Autowired RacePlayerChallengeOfferRepository offerRepository;
    @Autowired RacePlayerGameplayStateRepository stateRepository;
    @Autowired RacePlayerSpeedEffectRepository effectRepository;
    @Autowired StudentChallengeChoiceService choiceService;
    @Autowired StudentRaceStateService raceStates;
    @Autowired StudentQuestionDeliveryService questions;
    @Autowired RacePlayerGameplayTimelineService timeline;
    @Autowired RacePlayerReconnectService reconnect;
    @MockitoBean RacePlayerQuestionPlanService plans;
    @MockitoBean QuestionGenerationService generation;

    @BeforeEach
    void prepareChallenge() {
        secondPosition(100.0);
        transactions.executeWithoutResult(status -> {
            var player = locked();
            stateService.obtainForLockedPlayer(player);
            var easy = questionRepository.findById(questionId).orElseThrow().getQuestionTemplate();
            var hard = new QuestionTemplate();
            hard.setSubject(easy.getSubject());
            hard.setType(easy.getType());
            hard.setDifficulty(Difficulty.HARD);
            hard.setMinValue(easy.getMinValue());
            hard.setMaxValue(easy.getMaxValue());
            hard.setTimeLimitSeconds(45);
            hard.setChoicesCount(easy.getChoicesCount());
            hard.setGenerationPattern(easy.getGenerationPattern());
            entityManager.persist(hard);
        });
    }

    RacePlayer locked() {
        return playerRepository.findLockedByIdAndRaceId(secondId, raceId).orElseThrow();
    }

    void energy(int amount) {
        transactions.executeWithoutResult(status -> stateRepository.findByRacePlayerId(secondId)
                .orElseThrow().setChallengeEnergy(amount));
    }

    int energy() {
        return transactions.execute(status -> stateRepository.findByRacePlayerId(secondId)
                .orElseThrow().getChallengeEnergy());
    }

    Long openOffer() {
        energy(80);
        var snapshot = answerSecond().getRaceImpact().getSnapshot();
        return snapshot.getGameplay().challenge().offer().offerId();
    }

    RacePlayerChallengeOffer offer(Long id) {
        return transactions.execute(status -> offerRepository.findById(id).orElseThrow());
    }

    StudentRaceRuntimeSnapshotResponse snapshot() {
        return raceStates.getRaceState(secondRequest).getSnapshot();
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
            org.mockito.Mockito.doReturn(generated).when(generation).generate(any());
        });
    }
}
