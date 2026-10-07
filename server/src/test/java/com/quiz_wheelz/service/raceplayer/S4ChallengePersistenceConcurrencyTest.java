package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

class S4ChallengePersistenceConcurrencyTest extends S4ChallengeIntegrationFixture {
    @Test
    void concurrentAnswerProducesExactlyOneOfferAndOneEnergyConsumption() throws Exception {
        energy(80);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var first = pool.submit(() -> answerAfter(start));
            var second = pool.submit(() -> answerAfter(start));
            start.countDown();
            assertEquals(1, first.get(15, TimeUnit.SECONDS) + second.get(15, TimeUnit.SECONDS));
        }
        assertEquals(0, energy());
        assertEquals(1L, transactions.<Long>execute(status -> entityManager.createQuery(
                "select count(o) from RacePlayerChallengeOffer o where o.racePlayer.id = :id", Long.class)
                .setParameter("id", secondId).getSingleResult()));
    }

    @Test
    void concurrentSameChoicePersistsOneSelectionAndStableResolution() throws Exception {
        Long id = openOffer();
        clock.set(T + 5_000);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var body = new StudentChallengeChoiceRequest(id, "SAFE_RUN");
            var first = pool.submit(() -> {
                start.await();
                return choiceService.choose(secondRequest, body);
            });
            var second = pool.submit(() -> {
                start.await();
                return choiceService.choose(secondRequest, body);
            });
            start.countDown();
            assertEquals(first.get(15, TimeUnit.SECONDS).selectedAtEpochMs(),
                    second.get(15, TimeUnit.SECONDS).selectedAtEpochMs());
        }
        assertEquals(ChallengeOfferStatus.SELECTED, offer(id).getStatus());
        assertEquals(T + 5_000, offer(id).getResolvedAtEpochMs());
    }

    @Test
    void concurrentExpiryCreatesExactlyOneHistoricalEffect() throws Exception {
        Long id = openOffer();
        clock.set(T + 14_000);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var first = pool.submit(() -> {
                start.await();
                return snapshot();
            });
            var second = pool.submit(() -> {
                start.await();
                return snapshot();
            });
            start.countDown();
            first.get(15, TimeUnit.SECONDS);
            second.get(15, TimeUnit.SECONDS);
        }
        assertEquals(ChallengeOfferStatus.EXPIRED, offer(id).getStatus());
        assertEquals(50, energy());
        assertEquals(1, transactions.<Integer>execute(status -> effectRepository
                .findOverlapping(secondId, T, T + 30_000).size()));
    }

    @Test
    void energyAboveMaximumFailsValidationAndDatabaseCheck() {
        assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status -> {
            stateRepository.findByRacePlayerId(secondId).orElseThrow().setChallengeEnergy(101);
            entityManager.flush();
        }));
        assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status ->
                entityManager.createNativeQuery("update race_player_gameplay_states set challenge_energy = 101 "
                        + "where race_player_id = :id").setParameter("id", secondId).executeUpdate()));
        assertEquals(0, energy());
    }

    @Test
    void databaseRejectsInconsistentOfferLifecycle() {
        Long id = openOffer();
        assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status ->
                entityManager.createNativeQuery("update race_player_challenge_offers set status = 'SELECTED' "
                        + "where id = :id").setParameter("id", id).executeUpdate()));
        assertThrows(RuntimeException.class, () -> transactions.executeWithoutResult(status ->
                entityManager.createNativeQuery("update race_player_challenge_offers set expires_at_epoch_ms = "
                        + "offered_at_epoch_ms where id = :id").setParameter("id", id).executeUpdate()));
        assertEquals(ChallengeOfferStatus.ACTIVE, offer(id).getStatus());
    }

    @Test
    void mutationServicesRequireCallerTransaction() {
        assertThrows(org.springframework.transaction.IllegalTransactionStateException.class,
                () -> offers.afterAnswer(second(), question(), Difficulty.EASY, true, T));
    }

    private int answerAfter(CountDownLatch start) throws InterruptedException {
        start.await();
        try {
            answerSecond();
            return 1;
        } catch (ApiException exception) {
            assertEquals(com.quiz_wheelz.exception.ErrorCode.QUESTION_NOT_ACTIVE, exception.getErrorCode());
            return 0;
        }
    }
}
