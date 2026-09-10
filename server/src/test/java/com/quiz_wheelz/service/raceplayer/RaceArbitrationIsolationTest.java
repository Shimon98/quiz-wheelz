package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.repository.RaceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mockingDetails;

class RaceArbitrationIsolationTest extends RaceChronologyIntegrationFixture {

    @MockitoSpyBean
    RaceRepository observedRaceRepository;

    @Autowired
    DataSource dataSource;

    private final ExecutorService executor = Executors.newFixedThreadPool(2);

    @AfterEach
    void stopExecutor() {
        executor.shutdownNow();
    }

    @Test
    void answerCommittingAfterPreflightCannotBeTimedOutByWaitingArbitration() throws Exception {
        secondPosition(100.0);
        questionExpiry(T + 500);
        clock.set(T + 100);
        CountDownLatch answerLocked = new CountDownLatch(1);
        CountDownLatch releaseAnswer = new CountDownLatch(1);
        CountDownLatch preflightRead = new CountDownLatch(1);
        AtomicInteger actualIsolation = new AtomicInteger();
        doAnswer(invocation -> {
            Object result = mockingDetails(observedRaceRepository).getMockCreationSettings()
                    .getDefaultAnswer().answer(invocation);
            actualIsolation.set(DataSourceUtils.getConnection(dataSource).getTransactionIsolation());
            preflightRead.countDown();
            return result;
        }).when(observedRaceRepository).findStatusById(raceId);

        var answer = executor.submit(() -> transactions.execute(status -> {
            var player = playerRepository.findLockedByIdAndRaceId(secondId, raceId).orElseThrow();
            liveMutationGate.lockIfActive(player).orElseThrow();
            answerLocked.countDown();
            await(releaseAnswer);
            var response = answerSecond();
            clock.set(T + 600);
            return response;
        }));
        assertTrue(answerLocked.await(10, TimeUnit.SECONDS));
        var arbitration = executor.submit(() -> arbitrationService.arbitrate(secondRequest));
        try {
            if (!preflightRead.await(5, TimeUnit.SECONDS)) {
                arbitration.get(1, TimeUnit.SECONDS);
                throw new IllegalStateException("Arbitration did not complete its preflight read");
            }
            assertThrows(TimeoutException.class, () -> arbitration.get(150, TimeUnit.MILLISECONDS));
        } finally {
            releaseAnswer.countDown();
        }
        answer.get(20, TimeUnit.SECONDS);
        var response = arbitration.get(20, TimeUnit.SECONDS);

        assertEquals(Connection.TRANSACTION_READ_COMMITTED, actualIsolation.get());
        assertEquals(PlayerQuestionStatus.ANSWERED, question().getStatus());
        assertEquals(local(T + 100), question().getAnsweredAt());
        assertEquals(1, second().getCorrectAnswers());
        assertEquals(0, second().getWrongAnswers());
        assertEquals(1.2, second().getSpeed());
        assertEquals(112.8, second().getPosition(), 1e-9);
        assertEquals(List.of(RaceLiveEventType.QUESTION_ANSWERED,
                RaceLiveEventType.PLAYER_PROGRESS_UPDATED,
                RaceLiveEventType.PLAYER_PROGRESS_UPDATED), eventTypes());
        assertEquals(3L, response.getSnapshot().getEventVersion());
        assertEquals(T + 600, race().getAuthoritativeDecisionTimeFloorEpochMs());
    }

    @Test
    void answerWaitingBehindArbitrationUsesItsCommittedFloorAfterClockRegression() throws Exception {
        CountDownLatch arbitrationSettling = new CountDownLatch(1);
        CountDownLatch releaseArbitration = new CountDownLatch(1);
        AtomicInteger presenceReads = new AtomicInteger();
        doAnswer(invocation -> {
            if (presenceReads.getAndIncrement() == 0) {
                arbitrationSettling.countDown();
                await(releaseArbitration);
            }
            return true;
        }).when(redisPresenceService).isOnline(anyLong(), anyLong());

        var arbitration = executor.submit(() -> arbitrationService.arbitrate(firstRequest));
        assertTrue(arbitrationSettling.await(10, TimeUnit.SECONDS));
        clock.set(T - 1_100);
        var answer = executor.submit(this::answerSecond);
        try {
            assertThrows(TimeoutException.class, () -> answer.get(150, TimeUnit.MILLISECONDS));
        } finally {
            releaseArbitration.countDown();
        }
        var proof = arbitration.get(20, TimeUnit.SECONDS).getFinishOrder();
        var response = answer.get(20, TimeUnit.SECONDS);

        assertEquals(firstId, proof.getConfirmedFinishers().getFirst().getRacePlayerId());
        assertEquals(T, response.getAnsweredAtEpochMs());
        assertEquals(T, second().getFinishedAtEpochMs());
        assertEquals(2, response.getRaceImpact().getSnapshot().getRank());
        assertEquals(T, race().getAuthoritativeDecisionTimeFloorEpochMs());
        assertEquals(List.of(RaceLiveEventType.QUESTION_ANSWERED,
                RaceLiveEventType.PLAYER_FINISHED, RaceLiveEventType.RACE_FINISHED), eventTypes());
    }

    private void await(CountDownLatch latch) {
        try {
            assertTrue(latch.await(10, TimeUnit.SECONDS));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }
}
