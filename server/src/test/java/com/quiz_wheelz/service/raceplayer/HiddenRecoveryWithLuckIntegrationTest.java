package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.entitys.RacePlayerRecoveryState;
import com.quiz_wheelz.enums.LuckEventType;
import com.quiz_wheelz.enums.LuckOutcome;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRecoveryStateRepository;
import com.quiz_wheelz.service.recovery.HiddenRecoveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

// Hidden Recovery and Luck on the same answer: the nudge lands after the normal gain and before the offer check, and
// Luck rolls last, so an Energy Orb is sized on the meter the nudge left and an offer the nudge opens stops the roll.
@TestPropertySource(properties = ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED + "=true")
@Import(HiddenRecoveryService.class)
class HiddenRecoveryWithLuckIntegrationTest extends B1LuckIntegrationFixture {
    @Autowired RacePlayerRecoveryStateRepository recoveryStates;

    @BeforeEach
    void farBehindAmongRacingClassmates() {
        allowGeneration();
        secondPosition(300.0);
        transactions.executeWithoutResult(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            entityManager.persist(player(race, "Leader", 3, 480.0));
            entityManager.persist(player(race, "Middle", 4, 400.0));
        });
    }

    @Test
    void aNudgeAndAnEnergyOrbOnTheSameAnswerFillTheMeterExactlyAndTheNextRightAnswerOpensOneOffer() {
        struggleThroughFiveOutcomes();
        energy(60);
        when(random.nextDouble()).thenReturn(0.0, 0.5);

        var qualifying = answer(true);

        var gameplay = qualifying.getRaceImpact().getSnapshot().getGameplay();
        assertEquals(10, recoveryState().getAwardedEnergy());
        assertEquals(qualifying.getQuestionId(), recoveryState().getAwardedQuestionId());
        var orb = history().getLast();
        assertEquals(LuckOutcome.APPLIED, orb.getOutcome());
        assertEquals(LuckEventType.ENERGY_ORB, orb.getAppliedType());
        assertEquals(10.0, orb.getEffectiveMagnitudeOrEnergyDelta());
        assertEquals(100, energy());
        assertEquals(100, gameplay.challenge().energy());
        assertNull(gameplay.challenge().offer());

        var next = answer(true);

        assertNotNull(next.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(1, offerRepository.findAll().stream()
                .filter(offer -> offer.getRacePlayer().getId().equals(secondId)).count());
        assertEquals(0, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
        assertEquals(2, history().size());
    }

    @Test
    void aNudgeThatFillsTheMeterOpensTheOfferAndLuckDoesNotRollOnThatAnswer() {
        struggleThroughFiveOutcomes();
        energy(70);
        when(random.nextDouble()).thenReturn(0.0, 0.5);

        var qualifying = answer(true);

        assertNotNull(qualifying.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(0, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
        assertEquals(1, history().size());
        assertEquals(1, gameplay().getLuckRollsTaken());
        assertNull(gameplay().getNextLuckRollNotBeforeEpochMs());
    }

    @Test
    void theQualifyingAnswerPostedTwiceGrantsAndRollsOnce() {
        struggleThroughFiveOutcomes();
        energy(60);
        when(random.nextDouble()).thenReturn(0.0, 0.5);
        var qualifying = answer(true);
        var replay = new SubmitAnswerRequest();
        replay.setQuestionId(qualifying.getQuestionId());
        replay.setChoiceId(qualifying.getSelectedChoiceId());

        var error = assertThrows(ApiException.class, () -> answerService.submitAnswer(second(), replay));

        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, error.getErrorCode());
        assertEquals(100, energy());
        assertEquals(10, recoveryState().getAwardedEnergy());
        assertEquals(2, history().size());
    }

    // W, W, W, C, W: four failures keep the qualifying answer the student's second right one, so no Guard Shield lands
    // on it (a shield answer never rolls Luck). The first answer rolled NO_EVENT and started the 45 s cooldown; open
    // it again, as 45 quiet seconds would, so the qualifying answer may roll.
    private void struggleThroughFiveOutcomes() {
        answer(false);
        answer(false);
        answer(false);
        answer(true);
        answer(false);
        assertEquals(5, recoveryState().getRecentOutcomeCount());
        assertEquals(1, history().size());
        transactions.executeWithoutResult(status -> stateRepository.findByRacePlayerId(secondId).orElseThrow()
                .setNextLuckRollNotBeforeEpochMs(null));
    }

    private RacePlayerRecoveryState recoveryState() {
        return transactions.execute(status -> recoveryStates.findByRacePlayerId(secondId).orElseThrow());
    }
}
