package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.service.luck.LuckOwnStateReader;
import com.quiz_wheelz.service.luck.LuckPeerJdbcResources;
import com.quiz_wheelz.support.LuckLoadEvidence;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.util.AopTestUtils;
import javax.sql.DataSource;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
class B1LuckCrossRaceMySqlTest extends B1LuckIntegrationFixture {
    @Autowired DataSource source;
    @Autowired LuckPeerJdbcResources resources;
    @MockitoSpyBean LuckOwnStateReader ownState;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        B1LuckAnswerMySqlTest.database(properties);
        properties.add("spring.datasource.hikari.maximum-pool-size", () -> "8");
        properties.add("spring.datasource.hikari.minimum-idle", () -> "8");
        properties.add("QUIZWHEELZ_LUCK_PEER_POOL_MAX_SIZE", () -> "2");
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 4, 8})
    void tenRepeatedColdConcurrentRaceGroupsCommitEveryAnswer(int count) throws Exception {
        var writer = source.unwrap(HikariDataSource.class);
        try (var connection = writer.getConnection()) {
            assertEquals("MySQL", connection.getMetaData().getDatabaseProductName());
            assertEquals(java.sql.Connection.TRANSACTION_REPEATABLE_READ, connection.getTransactionIsolation());
        }
        try (var evidence = new LuckLoadEvidence("cross-race-" + count, writer, resources);
             var executor = Executors.newFixedThreadPool(count)) {
            for (int repetition = 0; repetition < 10; repetition++) {
                var submissions = new java.util.ArrayList<Submission>();
                for (int index = 0; index < count; index++) submissions.add(coldRace());
                var ready = new CountDownLatch(count);
                var futures = new java.util.ArrayList<Future<?>>();
                for (var answer : submissions) futures.add(executor.submit(() -> {
                    long started = System.nanoTime();
                    var response = transactions.execute(status -> {
                        var player = playerRepository.findLockedByIdAndRaceId(answer.playerId(), answer.raceId()).orElseThrow();
                        raceRepository.findLockedById(answer.raceId()).orElseThrow();
                        assertTrue(fairnessStates.findByRaceId(answer.raceId()).isEmpty());
                        assertTrue(decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(answer.playerId()).isEmpty());
                        ready.countDown();
                        assertTrue(await(ready));
                        return answerService.submitAnswer(player, requestFor(answer));
                    });
                    evidence.completed(started);
                    return response;
                }));
                for (var future : futures) assertNotNull(future.get(30, TimeUnit.SECONDS));
                for (var answer : submissions) verifyCommitted(answer);
                assertEquals(0, resources.snapshot().active());
            }
        }
        verify(random, times(10 * count)).nextDouble();
    }

    @Test
    void coldRacesDrawingSpeedEventsAtTheSameMomentCommitBothAnswers() throws Exception {
        when(random.nextDouble()).thenReturn(0.0);
        var bothChecked = new CyclicBarrier(2);
        var checkedTogether = new AtomicInteger();
        doAnswer(invocation -> {
            Object overlap = invocation.callRealMethod();
            try {
                bothChecked.await(10, TimeUnit.SECONDS);
            } catch (TimeoutException | BrokenBarrierException error) {
                throw new IllegalStateException("Both speed-effect checks must run before either insert", error);
            }
            checkedTogether.incrementAndGet();
            return overlap;
        }).when(AopTestUtils.<LuckOwnStateReader>getUltimateTargetObject(ownState))
                .hasOverlap(anyLong(), anyLong(), anyLong());
        try (var executor = Executors.newFixedThreadPool(2)) {
            for (int repetition = 0; repetition < 5; repetition++) {
                var submissions = java.util.List.of(coldRace(), coldRace());
                var futures = new java.util.ArrayList<Future<?>>();
                for (var answer : submissions) futures.add(executor.submit(() -> answerService.submitAnswer(
                        playerRepository.findById(answer.playerId()).orElseThrow(), requestFor(answer))));
                for (var future : futures) assertNotNull(future.get(30, TimeUnit.SECONDS));
                for (var answer : submissions) {
                    verifyCommitted(answer);
                    var decision = decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(answer.playerId()).getFirst();
                    assertEquals(LuckEventType.TAILWIND, decision.getAppliedType());
                    assertEquals(LuckOutcome.APPLIED, decision.getOutcome());
                }
            }
        }
        assertEquals(10, checkedTogether.get());
    }

    @Test
    void actualMySqlQueryTimeoutReturnsReaderAndRejectsOversubscribedServerBudget() throws Exception {
        try (var connection = resources.connection(); var statement = connection.createStatement()) {
            statement.setQueryTimeout(resources.queryTimeoutSeconds());
            long started = System.nanoTime();
            var failure = assertThrows(java.sql.SQLTimeoutException.class, () -> statement.executeQuery("select sleep(5)"));
            long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
            assertTrue(elapsed >= 700 && elapsed < 4000, "elapsed=" + elapsed);
            System.out.println("LUCK_QUERY_TIMEOUT elapsedMs=" + elapsed + " type=" + failure.getClass().getName());
        }
        assertEquals(0, resources.snapshot().active());
        var rejected = new LuckPeerJdbcResources(source, "", 1, 1000, 1, 1, 151, 10);
        try {
            assertThrows(IllegalStateException.class, rejected::connection);
            assertEquals(0, rejected.snapshot().active());
        } finally {
            rejected.close();
        }
    }

    private SubmitAnswerRequest requestFor(Submission answer) {
        var request = new SubmitAnswerRequest();
        request.setQuestionId(answer.questionId());
        request.setChoiceId(answer.choiceId());
        return request;
    }

    private boolean await(CountDownLatch ready) {
        try {
            return ready.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(error);
        }
    }

    private void verifyCommitted(Submission answer) {
        transactions.executeWithoutResult(status -> {
            var player = playerRepository.findById(answer.playerId()).orElseThrow();
            var state = stateRepository.findByRacePlayerId(answer.playerId()).orElseThrow();
            assertEquals(PlayerQuestionStatus.ANSWERED, questionRepository.findById(answer.questionId()).orElseThrow().getStatus());
            assertEquals(10, player.getScore());
            assertEquals(110.0, player.getPosition());
            assertEquals(20, state.getChallengeEnergy());
            assertEquals(1, state.getLuckRollsTaken());
            assertEquals(1, decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(answer.playerId()).size());
            assertEquals(1L, fairnessStates.findByRaceId(answer.raceId()).orElseThrow().getDecisionSequence());
            assertEquals(1L, entityManager.createQuery("select count(e) from RaceLiveEvent e where e.race.id = :race and e.type = :type", Long.class)
                    .setParameter("race", answer.raceId()).setParameter("type", RaceLiveEventType.QUESTION_ANSWERED).getSingleResult());
        });
    }

    private Submission coldRace() {
        return transactions.execute(status -> {
            var original = raceRepository.findById(raceId).orElseThrow();
            var race = new Race();
            race.setTeacher(original.getTeacher());
            race.setSubject(original.getSubject());
            race.setRoomCode(java.util.UUID.randomUUID().toString().substring(0, 6));
            race.setTitle("Cold cross-race test");
            race.setTotalDistance(1000);
            race.setMaxPlayers(8);
            race.setStatus(RaceStatus.IN_PROGRESS);
            race.setStartedAt(local(T));
            entityManager.persist(race);
            var player = player(race, "Concurrent", 1, 100.0);
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
            choice.setCorrect(true);
            choice.setDisplayOrder(1);
            entityManager.persist(choice);
            return new Submission(race.getId(), player.getId(), question.getId(), choice.getId());
        });
    }

    private record Submission(long raceId, long playerId, long questionId, long choiceId) {
    }
}
