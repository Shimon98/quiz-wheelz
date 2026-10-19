package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.service.luck.LuckOwnStateReader;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLTransientConnectionException;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class B1LuckPoolMySqlTest extends B1LuckIntegrationFixture {
    @Autowired DataSource source;
    @MockitoSpyBean LuckOwnStateReader ownState;
    @MockitoSpyBean com.quiz_wheelz.service.luck.LuckPeerJdbcResources peerResources;
    @Autowired org.springframework.context.ApplicationContext context;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        B1LuckAnswerMySqlTest.database(properties);
        properties.add("spring.datasource.hikari.maximum-pool-size", () -> "2");
        properties.add("spring.datasource.hikari.minimum-idle", () -> "2");
        properties.add("spring.datasource.hikari.connection-timeout", () -> "1500");
        properties.add("QUIZWHEELZ_LUCK_PEER_POOL_MAX_SIZE", () -> "1");
        properties.add("QUIZWHEELZ_LUCK_PEER_ACQUIRE_TIMEOUT_MS", () -> "5000");
    }

    @Test
    void twoRealAnswerTransactionsInDistinctRacesUseIndependentPeerCapacity() throws Exception {
        var pool = source.unwrap(HikariDataSource.class);
        assertEquals(2, pool.getMaximumPoolSize());
        assertEquals(1500, pool.getConnectionTimeout());
        try (var connection = pool.getConnection()) {
            assertEquals("MySQL", connection.getMetaData().getDatabaseProductName());
            assertEquals(Connection.TRANSACTION_REPEATABLE_READ, connection.getTransactionIsolation());
        }
        var first = new Submission(raceId, secondId, questionId, request(true).getChoiceId());
        var second = secondRace();
        assertEquals(1, context.getBeansOfType(DataSource.class).size());
        var managers = context.getBeansOfType(org.springframework.transaction.PlatformTransactionManager.class);
        assertEquals(1, managers.size());
        var jpaManager = assertInstanceOf(org.springframework.orm.jpa.JpaTransactionManager.class,
                managers.values().iterator().next());
        assertSame(source, jpaManager.getDataSource());
        var firstPeerHeld = new CountDownLatch(1);
        var releaseFirstPeer = new CountDownLatch(1);
        var peerCalls = new java.util.concurrent.atomic.AtomicInteger();
        var bothOuterConnectionsHeld = new CountDownLatch(2);
        doAnswer(call -> {
            bothOuterConnectionsHeld.countDown();
            assertTrue(bothOuterConnectionsHeld.await(10, TimeUnit.SECONDS));
            Connection connection = (Connection) call.callRealMethod();
            assertEquals(Connection.TRANSACTION_READ_COMMITTED, connection.getTransactionIsolation());
            assertTrue(connection.getAutoCommit());
            assertTrue(connection.isReadOnly());
            if (peerCalls.incrementAndGet() == 1) {
                firstPeerHeld.countDown();
                assertTrue(releaseFirstPeer.await(10, TimeUnit.SECONDS));
            }
            return connection;
        }).when(peerResources).connection();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var one = executor.submit(() -> submit(first));
            var two = executor.submit(() -> submit(second));
            assertTrue(bothOuterConnectionsHeld.await(10, TimeUnit.SECONDS));
            try {
                assertTrue(firstPeerHeld.await(10, TimeUnit.SECONDS));
                boolean peerQueued = false;
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
                while (System.nanoTime() < deadline) {
                    if (peerResources.snapshot().waiting() == 1) {
                        peerQueued = true;
                        break;
                    }
                    Thread.onSpinWait();
                }
                assertTrue(peerQueued);
                assertEquals(2, pool.getHikariPoolMXBean().getActiveConnections());
                assertEquals(0, pool.getHikariPoolMXBean().getThreadsAwaitingConnection());
                assertEquals(1, peerResources.snapshot().active());
            } finally {
                releaseFirstPeer.countDown();
            }
            RuntimeException firstError = one.get(15, TimeUnit.SECONDS);
            RuntimeException secondError = two.get(15, TimeUnit.SECONDS);
            assertNull(firstError);
            assertNull(secondError);
            assertEquals(0, peerResources.snapshot().active());
            verifyAtomic(first, firstError);
            verifyAtomic(second, secondError);
        }
    }

    @Test
    void coldCrossRaceInitializationCommitsBothWithoutGapLockDeadlock() throws Exception {
        var first = new Submission(raceId, secondId, questionId, request(true).getChoiceId());
        var second = secondRace();
        var gapReadsHeld = new CountDownLatch(2);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = new java.util.ArrayList<Future<RuntimeException>>();
            for (var submission : java.util.List.of(first, second)) {
                results.add(executor.submit(() -> {
                    try {
                        transactions.executeWithoutResult(status -> {
                            playerRepository.findLockedByIdAndRaceId(submission.playerId(), submission.raceId()).orElseThrow();
                            raceRepository.findLockedById(submission.raceId()).orElseThrow();
                            assertTrue(fairnessStates.findByRaceId(submission.raceId()).isEmpty());
                            gapReadsHeld.countDown();
                            try {
                                assertTrue(gapReadsHeld.await(10, TimeUnit.SECONDS));
                            } catch (InterruptedException error) {
                                Thread.currentThread().interrupt();
                                throw new IllegalStateException(error);
                            }
                            var error = submit(submission);
                            if (error != null) throw error;
                        });
                        return null;
                    } catch (RuntimeException error) {
                        return error;
                    }
                }));
            }
            RuntimeException firstError = results.get(0).get(20, TimeUnit.SECONDS);
            RuntimeException secondError = results.get(1).get(20, TimeUnit.SECONDS);
            assertNull(firstError);
            assertNull(secondError);
            verifyColdAtomic(first, firstError);
            verifyColdAtomic(second, secondError);
        }
    }

    private boolean deadlock(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof java.sql.SQLException sql && sql.getErrorCode() == 1213) return true;
        }
        return false;
    }

    private void verifyColdAtomic(Submission submission, RuntimeException error) {
        transactions.executeWithoutResult(status -> {
            boolean success = error == null;
            assertEquals(success ? PlayerQuestionStatus.ANSWERED : PlayerQuestionStatus.ACTIVE,
                    questionRepository.findById(submission.questionId()).orElseThrow().getStatus());
            assertEquals(success ? 10 : 0, playerRepository.findById(submission.playerId()).orElseThrow().getScore());
            assertEquals(success ? 1 : 0,
                    decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(submission.playerId()).size());
            assertEquals(success, fairnessStates.findByRaceId(submission.raceId()).isPresent());
        });
    }

    private RuntimeException submit(Submission submission) {
        var race = new Race();
        race.setId(submission.raceId());
        var player = new RacePlayer();
        player.setRace(race);
        player.setId(submission.playerId());
        var request = new SubmitAnswerRequest();
        request.setQuestionId(submission.questionId());
        request.setChoiceId(submission.choiceId());
        try {
            answerService.submitAnswer(player, request);
            return null;
        } catch (RuntimeException error) {
            return error;
        }
    }

    private void verifyAtomic(Submission submission, RuntimeException error) {
        transactions.executeWithoutResult(status -> {
            var question = questionRepository.findById(submission.questionId()).orElseThrow();
            var player = playerRepository.findById(submission.playerId()).orElseThrow();
            var state = stateRepository.findByRacePlayerId(submission.playerId()).orElseThrow();
            var history = decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(submission.playerId());
            boolean success = error == null;
            assertEquals(success ? PlayerQuestionStatus.ANSWERED : PlayerQuestionStatus.ACTIVE, question.getStatus());
            assertEquals(success ? 10 : 0, player.getScore());
            assertEquals(success ? 110.0 : 100.0, player.getPosition());
            assertEquals(success ? 20 : 0, state.getChallengeEnergy());
            assertEquals(success ? 1 : 0, history.size());
            assertEquals(success ? 1 : 0, state.getLuckRollsTaken());
            assertEquals(success ? 1L : 0L,
                    fairnessStates.findByRaceId(submission.raceId()).orElseThrow().getDecisionSequence());
        });
    }

    private boolean connectionTimeout(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLTransientConnectionException) return true;
        }
        return false;
    }

    private Submission secondRace() {
        return transactions.execute(status -> {
            var original = raceRepository.findById(raceId).orElseThrow();
            var race = new Race();
            race.setTeacher(original.getTeacher());
            race.setSubject(original.getSubject());
            race.setRoomCode(String.format("P%05d", raceId));
            race.setTitle("B1 pool race");
            race.setTotalDistance(1000);
            race.setMaxPlayers(8);
            race.setStatus(RaceStatus.IN_PROGRESS);
            race.setStartedAt(local(T));
            entityManager.persist(race);
            var player = player(race, "Pool player", 1, 100.0);
            entityManager.persist(player);
            stateService.createInitialState(player);
            var question = new PlayerQuestion();
            question.setRacePlayer(player);
            question.setQuestionTemplate(questionRepository.findById(questionId).orElseThrow().getQuestionTemplate());
            question.setQuestionText("1 + 1");
            question.setCorrectAnswerValue(2);
            question.setTimeLimitSeconds(30);
            question.setExpiresAt(local(T + 30000));
            entityManager.persist(question);
            var choice = new PlayerQuestionChoice();
            choice.setPlayerQuestion(question);
            choice.setChoiceText("2");
            choice.setAnswerValue(2);
            choice.setDisplayOrder(1);
            choice.setCorrect(true);
            entityManager.persist(choice);
            return new Submission(race.getId(), player.getId(), question.getId(), choice.getId());
        });
    }

    private record Submission(long raceId, long playerId, long questionId, long choiceId) {
    }
}
