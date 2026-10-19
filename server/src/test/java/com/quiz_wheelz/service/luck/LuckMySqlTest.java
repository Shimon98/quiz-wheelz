package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import javax.sql.DataSource;
import java.sql.Connection;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(LuckPeerReader.class)
class LuckMySqlTest extends LuckOrchestrationTest {
    @Autowired DataSource source;
    @Autowired LuckPeerReader reader;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_URL"));
        properties.add("spring.datasource.username", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_USER"));
        properties.add("spring.datasource.password", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_PASSWORD"));
        properties.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }

    @BeforeEach
    void verifyIsolation() throws Exception {
        try (var connection = source.getConnection()) {
            assertEquals("MySQL", connection.getMetaData().getDatabaseProductName());
            assertEquals(Connection.TRANSACTION_REPEATABLE_READ, connection.getTransactionIsolation());
        }
    }

    @Test
    void suspendedSnapshotReaderSeesCommitAfterRealRaceLockWait() throws Exception {
        Long peerId = tx.execute(status -> {
            var race = em.find(Race.class, raceId);
            race.setStatus(RaceStatus.IN_PROGRESS);
            var self = em.find(RacePlayer.class, playerId);
            self.setStatus(RacePlayerStatus.RACING);
            var peer = new RacePlayer();
            peer.setRace(race);
            peer.setDisplayName("Fresh peer");
            peer.setLaneNumber(2);
            peer.setStatus(RacePlayerStatus.RACING);
            em.persist(peer);
            var state = states.createInitialState(peer);
            state.setLastAcceptedManualNormalAnswerAtEpochMs(100L);
            return peer.getId();
        });
        var raceHeld = new CountDownLatch(1);
        var snapshotReady = new CountDownLatch(1);
        var attemptingRace = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var writer = executor.submit(() -> tx.execute(status -> {
                em.find(RacePlayer.class, peerId, LockModeType.PESSIMISTIC_WRITE);
                em.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
                raceHeld.countDown();
                await(snapshotReady);
                await(attemptingRace);
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                boolean observedWait = false;
                while (System.nanoTime() < deadline) {
                    Number waits = (Number) em.createNativeQuery(
                            "select count(*) from performance_schema.data_lock_waits").getSingleResult();
                    if (waits.longValue() > 0) {
                        observedWait = true;
                        break;
                    }
                    Thread.yield();
                }
                assertTrue(observedWait);
                var state = gameplay.findByRacePlayerId(peerId).orElseThrow();
                state.setLuckRollsTaken(1);
                state.setLastLuckRollSequence(7L);
                em.flush();
                return true;
            }));
            var waiting = executor.submit(() -> {
                await(raceHeld);
                return tx.execute(status -> {
                    em.find(RacePlayer.class, playerId, LockModeType.PESSIMISTIC_WRITE);
                    assertNull(em.createNativeQuery("select last_luck_roll_sequence from race_player_gameplay_states where race_player_id = :id")
                            .setParameter("id", peerId).getSingleResult());
                    snapshotReady.countDown();
                    attemptingRace.countDown();
                    em.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
                    assertNull(em.createNativeQuery("select last_luck_roll_sequence from race_player_gameplay_states where race_player_id = :id")
                            .setParameter("id", peerId).getSingleResult());
                    var peers = reader.readCommittedPeers(raceId, playerId, 100);
                    assertEquals(1, peers.size());
                    assertEquals(7L, peers.getFirst().lastRollSequence());
                    return true;
                });
            });
            assertTrue(writer.get(20, TimeUnit.SECONDS));
            assertTrue(waiting.get(20, TimeUnit.SECONDS));
        }
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(ints = {2, 4, 8})
    void simultaneousPlayersPersistSameMillisecondAuditWithoutDeadlock(int count) throws Exception {
        var ids = new java.util.ArrayList<Long>();
        ids.add(playerId);
        tx.executeWithoutResult(status -> {
            states.createInitialState(em.find(RacePlayer.class, playerId));
            for (int lane = 2; lane <= count; lane++) {
                var player = new RacePlayer();
                player.setRace(em.find(Race.class, raceId));
                player.setDisplayName("Concurrent " + lane);
                player.setLaneNumber(lane);
                player.setStatus(RacePlayerStatus.RACING);
                em.persist(player);
                states.createInitialState(player);
                ids.add(player.getId());
            }
        });
        var questions = new java.util.HashMap<Long, Long>();
        for (Long id : ids) {
            questions.put(id, tx.execute(status -> {
                var original = em.find(PlayerQuestion.class, questionId);
                var question = new PlayerQuestion();
                question.setRacePlayer(em.find(RacePlayer.class, id));
                question.setQuestionTemplate(original.getQuestionTemplate());
                question.setQuestionText("1+1");
                question.setCorrectAnswerValue(2);
                question.setTimeLimitSeconds(30);
                question.setExpiresAt(java.time.LocalDateTime.now().plusSeconds(30));
                question.setStatus(PlayerQuestionStatus.ANSWERED);
                em.persist(question);
                return question.getId();
            }));
        }
        org.mockito.Mockito.when(random.nextDouble()).thenReturn(0.6);
        var ownLocksHeld = new CountDownLatch(count);
        try (var executor = Executors.newFixedThreadPool(count)) {
            var futures = new java.util.ArrayList<Future<Long>>();
            for (Long id : ids) {
                futures.add(executor.submit(() -> tx.execute(status -> {
                    var player = em.find(RacePlayer.class, id, LockModeType.PESSIMISTIC_WRITE);
                    ownLocksHeld.countDown();
                    await(ownLocksHeld);
                    em.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
                    return luck.afterAcceptedManualNormalAnswer(player, em.find(PlayerQuestion.class, questions.get(id)),
                            false, true, 100).orElseThrow().getDecisionSequence();
                })));
            }
            var sequences = new java.util.ArrayList<Long>();
            for (var future : futures) sequences.add(future.get(30, TimeUnit.SECONDS));
            sequences.sort(Long::compareTo);
            assertEquals(java.util.stream.LongStream.rangeClosed(1, count).boxed().toList(), sequences);
        }
        tx.executeWithoutResult(status -> {
            for (Long id : ids) {
                var decision = decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(id).getFirst();
                assertEquals(100L, decision.getDecidedAtEpochMs());
                assertEquals(1, gameplay.findByRacePlayerId(id).orElseThrow().getLuckRollsTaken());
            }
            assertEquals((long) count, fairness.findByRaceId(raceId).orElseThrow().getDecisionSequence());
        });
    }

    @Test
    void concurrentDuplicateSourceUsesCurrentAuditReadWithoutExtraRandom() throws Exception {
        org.mockito.Mockito.when(random.nextDouble()).thenReturn(0.6);
        var snapshotsReady = new CountDownLatch(2);
        var calls = new java.util.concurrent.atomic.AtomicInteger();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var futures = new java.util.ArrayList<Future<Boolean>>();
            for (int index = 0; index < 2; index++) {
                futures.add(executor.submit(() -> tx.execute(status -> {
                    em.createQuery("select count(d) from RacePlayerLuckDecision d", Long.class).getSingleResult();
                    snapshotsReady.countDown();
                    await(snapshotsReady);
                    var player = em.find(RacePlayer.class, playerId, LockModeType.PESSIMISTIC_WRITE);
                    em.find(Race.class, raceId, LockModeType.PESSIMISTIC_WRITE);
                    long instant = calls.incrementAndGet() == 1 ? 100 : 100000;
                    return luck.afterAcceptedManualNormalAnswer(player, em.find(PlayerQuestion.class, questionId),
                            false, true, instant).isPresent();
                })));
            }
            int accepted = 0;
            for (var future : futures) if (future.get(20, TimeUnit.SECONDS)) accepted++;
            assertEquals(1, accepted);
        }
        org.mockito.Mockito.verify(random, org.mockito.Mockito.times(1)).nextDouble();
    }

    private static void await(CountDownLatch latch) {
        try {
            assertTrue(latch.await(10, TimeUnit.SECONDS));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }
}
