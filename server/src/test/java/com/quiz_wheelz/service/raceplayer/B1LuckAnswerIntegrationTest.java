package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class B1LuckAnswerIntegrationTest extends B1LuckIntegrationFixture {
    @Test
    void correctAnswerEnergySurvivesRefreshAndSnapshotWithNoEvent() {
        var response = submit(true);
        assertEquals(20, energy());
        assertEquals(20, response.getRaceImpact().getSnapshot().getGameplay().challenge().energy());
        assertEquals(1, second().getCorrectAnswers());
        assertEquals(10, second().getScore());
        assertEquals(110, second().getPosition());
        assertEquals(LuckOutcome.NO_EVENT, history().getFirst().getOutcome());
        assertEquals(1, eventTypes().stream().filter(type -> type == RaceLiveEventType.QUESTION_ANSWERED).count());
        assertEquals(race().getLiveEventVersion(), response.getRaceImpact().getSnapshot().getEventVersion());
    }

    @Test
    void thresholdOfferAndResetSurviveAndSuppressDraw() {
        energy(80);
        var response = submit(true);
        var challenge = response.getRaceImpact().getSnapshot().getGameplay().challenge();
        assertNotNull(challenge.offer());
        assertEquals(0, challenge.energy());
        assertEquals(0, energy());
        assertNotNull(offer(challenge.offer().offerId()));
        assertTrue(history().isEmpty());
        verifyNoInteractions(random);
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void orbAddsToNormalEnergyWithoutOfferingOnSameAnswer(boolean correct) {
        energy(correct ? 70 : 90);
        when(random.nextDouble()).thenReturn(0.0, 0.5);
        var response = submit(correct);
        assertEquals(100, energy());
        assertEquals(100, response.getRaceImpact().getSnapshot().getGameplay().challenge().energy());
        assertNull(response.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertEquals(LuckEventType.ENERGY_ORB, history().getFirst().getAppliedType());
        assertEquals(correct ? 1 : 0, second().getCorrectAnswers());
        nextQuestion(T);
        var next = submit(true).getRaceImpact().getSnapshot().getGameplay().challenge();
        assertNotNull(next.offer());
        assertEquals(0, next.energy());
        assertEquals(1, history().size());
    }

    @Test
    void firstWrongManualAnswerCanDrawAndDuplicateCannot() {
        when(random.nextDouble()).thenReturn(0.0, 0.5);
        var response = submit(false);
        assertEquals(0, second().getScore());
        assertEquals(1, second().getWrongAnswers());
        assertEquals(15, energy());
        assertEquals(15, response.getRaceImpact().getSnapshot().getGameplay().challenge().energy());
        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, assertThrows(ApiException.class, () -> submit(false)).getErrorCode());
        assertEquals(1, history().size());
        verify(random, times(2)).nextDouble();
    }

    @Test
    void cumulativeShieldSuppressesDrawAndNeverReawardsAfterConsumption() {
        submit(true);
        nextQuestion(T);
        submit(true);
        nextQuestion(T);
        submit(false);
        nextQuestion(T);
        Long awardQuestion = questionId;
        var response = submit(true);
        assertEquals(3, second().getCorrectAnswers());
        assertEquals(1, second().getStreak());
        assertEquals(60, energy());
        assertEquals(60, response.getRaceImpact().getSnapshot().getGameplay().challenge().energy());
        assertEquals(1, gameplay().getGuardShieldCharges());
        assertEquals(awardQuestion, gameplay().getGuardShieldAwardQuestionId());
        assertEquals(1, history().size());
        transactions.executeWithoutResult(status -> stateRepository.findByRacePlayerId(secondId)
                .orElseThrow().setGuardShieldCharges(0));
        nextQuestion(T);
        submit(true);
        assertEquals(0, gameplay().getGuardShieldCharges());
        assertEquals(awardQuestion, gameplay().getGuardShieldAwardQuestionId());
        verify(random, times(1)).nextDouble();
    }

    @Test
    void shieldAndOfferResetCanPersistTogetherWithoutDraw() {
        energy(80);
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow().setCorrectAnswers(2));
        var response = submit(true);
        assertEquals(1, gameplay().getGuardShieldCharges());
        assertEquals(0, energy());
        assertNotNull(response.getRaceImpact().getSnapshot().getGameplay().challenge().offer());
        assertTrue(history().isEmpty());
        verifyNoInteractions(random);
    }

    @ParameterizedTest
    @CsvSource({"SPEED_SLOW,-1,1,true", "SPEED_BOOST,-1,1,true", "SPEED_SLOW,0,1,true",
            "SPEED_BOOST,0,1,true", "SPEED_SLOW,-1,0,false", "SPEED_BOOST,-1,0,false",
            "SPEED_SLOW,1,4000,false", "SPEED_BOOST,1,4000,false"})
    void bothEffectTypesSuppressChallengeAndLuckOnlyWithinHalfOpenWindow(
            EffectType type, long start, long end, boolean active) {
        energy(80);
        effect(type, T + start, T + end);
        var response = submit(true);
        assertEquals(active ? 100 : 0, energy());
        assertEquals(active, response.getRaceImpact().getSnapshot().getGameplay().challenge().offer() == null);
        assertTrue(history().isEmpty());
        verifyNoInteractions(random);
    }

    @ParameterizedTest
    @ValueSource(doubles = {790, 990})
    void postAnswerEightyPercentOrFinishCannotAwardShieldOrLuck(double before) {
        secondPosition(before);
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow().setCorrectAnswers(2));
        submit(true);
        assertEquals(before + 10, second().getPosition());
        assertEquals(0, gameplay().getGuardShieldCharges());
        assertTrue(history().isEmpty());
        verifyNoInteractions(random);
    }

    @Test
    void stateRefreshReconnectAndAutomaticTimeoutCannotDraw() {
        snapshot();
        reconnect.reconnect(secondRequest);
        questionExpiry(T);
        snapshot();
        assertEquals(PlayerQuestionStatus.EXPIRED, question().getStatus());
        assertTrue(history().isEmpty());
        assertEquals(0, gameplay().getGuardShieldCharges());
        verifyNoInteractions(random);
    }

    @ParameterizedTest
    @ValueSource(strings = {"LATE", "INVALID_CHOICE", "WRONG_PLAYER", "ANSWERED", "DISCONNECTED", "FINISHED_RACE"})
    void rejectedAnswersCannotReachLuck(String exclusion) {
        var request = request(true);
        transactions.executeWithoutResult(status -> {
            switch (exclusion) {
                case "LATE" -> questionRepository.findById(questionId).orElseThrow().setExpiresAt(local(T));
                case "INVALID_CHOICE" -> request.setChoiceId(Long.MAX_VALUE);
                case "WRONG_PLAYER" -> questionRepository.findById(questionId).orElseThrow()
                        .setRacePlayer(playerRepository.findById(firstId).orElseThrow());
                case "ANSWERED" -> questionRepository.findById(questionId).orElseThrow().setStatus(PlayerQuestionStatus.ANSWERED);
                case "DISCONNECTED" -> playerRepository.findById(secondId).orElseThrow().setStatus(RacePlayerStatus.DISCONNECTED);
                case "FINISHED_RACE" -> raceRepository.findById(raceId).orElseThrow().setStatus(RaceStatus.FINISHED);
                default -> throw new IllegalArgumentException();
            }
        });
        if (exclusion.equals("FINISHED_RACE")) {
            assertThrows(org.springframework.transaction.UnexpectedRollbackException.class,
                    () -> answerService.submitAnswer(second(), request));
        } else {
            assertThrows(ApiException.class, () -> answerService.submitAnswer(second(), request));
        }
        assertTrue(history().isEmpty());
        assertEquals(0, gameplay().getGuardShieldCharges());
        verifyNoInteractions(random);
    }
}
