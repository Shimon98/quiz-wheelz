package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class S4ExecutionTimeoutTest extends S4ExecutionIntegrationFixture {
    @ParameterizedTest
    @ValueSource(longs = {15_000, 17_000, 19_000, 21_000})
    void turboTimeoutUsesExactExpiryAndLeavesLearningUntouched(long offset) {
        select(ChallengeChoice.TURBO_TRIAL);
        var question = current();
        var before = learning();
        double position = second().getPosition();
        double speed = second().getSpeed();
        clock.set(T + offset);
        var state = snapshot();
        assertEquals(before, learning());
        assertEquals(ChallengeOutcome.TURBO_FAILURE, offer(executionId).getOutcome());
        assertEquals(T + 15_000, offer(executionId).getExecutionEndedAtEpochMs());
        assertEquals(1, offer(executionId).getQuestionsResolved());
        assertEquals(0, offer(executionId).getCorrectAnswers());
        var effects = effects();
        assertEquals(1, effects.size());
        assertEquals(T + 15_000, effects.getFirst().getStartsAtEpochMs());
        assertEquals(T + 19_000, effects.getFirst().getEndsAtEpochMs());
        assertEquals(EffectSource.TURBO_FAILURE, effects.getFirst().getSource());
        assertEquals(2, effects.getFirst().getMagnitudeTenths());
        long slowMs = Math.min(offset - 15_000, 4000);
        assertEquals(position + speed * 4 * (offset - slowMs) / 1000.0
                + (speed - 0.2) * 4 * slowMs / 1000.0, second().getPosition(), 0.00001);
        assertEquals(offset < 19_000 ? 1 : 0, state.getGameplay().activeEffects().size());
        assertEquals(PlayerQuestionStatus.EXPIRED, transactions.execute(status -> questionRepository
                .findById(question.getQuestionId()).orElseThrow().getStatus()));
        snapshot();
        assertEquals(1, effects().size());
        assertEquals(1, offer(executionId).getQuestionsResolved());
    }

    @Test
    void partitionedAndOneShotTurboTimeoutAgree() {
        select(ChallengeChoice.TURBO_TRIAL);
        current();
        double position = second().getPosition();
        double speed = second().getSpeed();
        for (long offset : new long[]{8000, 15000, 17000, 19000, 21000}) {
            clock.set(T + offset);
            snapshot();
        }
        assertEquals(position + speed * 4 * 17 + (speed - 0.2) * 4 * 4, second().getPosition(), 0.00001);
        assertEquals(1, effects().size());
    }

    @Test
    void offlineTimeoutResolvesAtExpiryWithoutCatchupOrShiftOnReconnect() {
        select(ChallengeChoice.TURBO_TRIAL);
        current();
        double position = second().getPosition();
        double speed = second().getSpeed();
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(raceId, secondId))
                .thenReturn(Optional.of(Instant.ofEpochMilli(T + 8000)));
        clock.set(T + 21000);
        reconnect.reconnect(secondRequest);
        assertEquals(position + speed * 4 * 8, second().getPosition(), 0.00001);
        assertEquals(T + 15000, offer(executionId).getExecutionEndedAtEpochMs());
        assertEquals(T + 19000, effects().getFirst().getEndsAtEpochMs());
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(true);
        assertTrue(snapshot().getGameplay().activeEffects().isEmpty());
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void safeTimeoutAdvancesOnlyExecutionAndThirdCompletes(int timedOutQuestion) {
        select(ChallengeChoice.SAFE_RUN);
        for (int index = 1; index < timedOutQuestion; index++) {
            answer(true);
        }
        current();
        var before = learning();
        int score = second().getScore();
        clock.set(T + 15000);
        snapshot();
        assertEquals(before, learning());
        assertEquals(score, second().getScore());
        assertEquals(timedOutQuestion, offer(executionId).getQuestionsResolved());
        assertEquals(timedOutQuestion - 1, offer(executionId).getCorrectAnswers());
        assertTrue(effects().isEmpty());
        if (timedOutQuestion == 3) {
            assertEquals(ChallengeOutcome.SAFE_COMPLETE, offer(executionId).getOutcome());
            assertEquals(T + 15000, offer(executionId).getExecutionEndedAtEpochMs());
            assertEquals(RacePlayerGameplayMode.NORMAL, snapshot().getGameplay().mode());
        } else {
            assertNull(offer(executionId).getOutcome());
            assertEquals(RacePlayerGameplayMode.SAFE_RUN, snapshot().getGameplay().mode());
            assertEquals(QuestionGameplayContext.SAFE_RUN, current().getGameplayContext());
        }
    }

    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void movementFinishAbortsAndExpiresQuestionWithoutResultOrPenalty(ChallengeChoice choice) {
        select(choice);
        var question = current();
        secondPosition(999);
        clock.set(T + 1000);
        var state = snapshot();
        assertEquals(RacePlayerStatus.FINISHED, state.getPlayerStatus());
        assertEquals(ChallengeOfferStatus.SELECTED, offer(executionId).getStatus());
        assertEquals(choice, offer(executionId).getChoice());
        assertEquals(second().getFinishedAtEpochMs(), offer(executionId).getExecutionEndedAtEpochMs());
        assertNull(offer(executionId).getOutcome());
        assertNull(state.getGameplay().challenge().lastResult());
        assertNull(state.getGameplay().challenge().run());
        assertEquals(RacePlayerGameplayMode.NORMAL, state.getGameplay().mode());
        assertTrue(effects().isEmpty());
        assertEquals(0, energy());
        assertEquals(PlayerQuestionStatus.EXPIRED, transactions.execute(status -> questionRepository
                .findById(question.getQuestionId()).orElseThrow().getStatus()));
        assertEquals(T, choiceService.choose(secondRequest,
                new StudentChallengeChoiceRequest(executionId, choice.name())).selectedAtEpochMs());
    }

    private java.util.List<com.quiz_wheelz.entitys.RacePlayerSpeedEffect> effects() {
        return transactions.execute(status -> effectRepository.findOverlapping(secondId, T, T + 30000));
    }
}
