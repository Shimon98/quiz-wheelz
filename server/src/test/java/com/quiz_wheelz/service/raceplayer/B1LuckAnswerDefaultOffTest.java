package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.repository.RacePlayerLuckDecisionRepository;
import com.quiz_wheelz.repository.RaceLuckFairnessStateRepository;
import com.quiz_wheelz.service.luck.LuckRandomSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@org.springframework.context.annotation.Import(com.quiz_wheelz.service.luck.LuckPeerJdbcResources.class)
class B1LuckAnswerDefaultOffTest extends S4ChallengeIntegrationFixture {
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean com.quiz_wheelz.service.luck.LuckPeerJdbcResources resources;
    @Autowired Environment environment;
    @Autowired RacePlayerLuckDecisionRepository decisions;
    @Autowired RaceLuckFairnessStateRepository fairness;
    @MockitoBean LuckRandomSource random;

    @Test
    void unspecifiedGateLeavesAnswerAndChallengeBehaviorUnchangedWithoutLuckRows() throws Exception {
        assertFalse(environment.getProperty(ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED, Boolean.class, false));
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow().setCorrectAnswers(2));
        var response = answerSecond();
        assertEquals(3, second().getCorrectAnswers());
        assertEquals(20, energy());
        assertEquals(20, response.getRaceImpact().getSnapshot().getGameplay().challenge().energy());
        transactions.executeWithoutResult(status -> {
            assertTrue(decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(secondId).isEmpty());
            assertTrue(fairness.findByRaceId(raceId).isEmpty());
            var state = stateRepository.findByRacePlayerId(secondId).orElseThrow();
            assertFalse(state.getGuardShieldGranted());
            assertEquals(0, state.getLuckRollsTaken());
            assertNull(state.getLastAcceptedManualNormalAnswerAtEpochMs());
        });
        verifyNoInteractions(random);
        verify(resources, never()).connection();
        assertFalse(resources.snapshot().started());
    }
    @Test
    void finishedRaceRetainsExistingRollbackOnlyErrorSemanticsWithGateOff() {
        transactions.executeWithoutResult(status -> raceRepository.findById(raceId).orElseThrow()
                .setStatus(com.quiz_wheelz.enums.RaceStatus.FINISHED));
        assertThrows(org.springframework.transaction.UnexpectedRollbackException.class, this::answerSecond);
        verifyNoInteractions(random);
    }
}
