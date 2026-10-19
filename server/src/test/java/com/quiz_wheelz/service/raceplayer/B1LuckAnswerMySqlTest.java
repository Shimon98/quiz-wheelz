package com.quiz_wheelz.service.raceplayer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import javax.sql.DataSource;
import java.sql.Connection;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class B1LuckAnswerMySqlTest extends B1LuckAnswerIntegrationTest {
    @Autowired DataSource source;
    @Autowired com.quiz_wheelz.service.luck.LuckPeerJdbcResources resources;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_URL"));
        properties.add("spring.datasource.username", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_USER"));
        properties.add("spring.datasource.password", () -> System.getenv("QUIZWHEELZ_LUCK_MYSQL_TEST_PASSWORD"));
        properties.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }

    @BeforeEach
    void verifyMySql() throws Exception {
        try (var connection = source.getConnection()) {
            assertEquals("MySQL", connection.getMetaData().getDatabaseProductName());
            assertEquals(Connection.TRANSACTION_REPEATABLE_READ, connection.getTransactionIsolation());
        }
    }
    static java.util.stream.IntStream repeatedPlayerCounts() {
        return java.util.stream.IntStream.range(0, 30).map(index -> new int[]{2, 4, 8}[index % 3]);
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.MethodSource("repeatedPlayerCounts")
    void simultaneousAcceptedAnswersUseAuthoritativeRaceSequence(int count) throws Exception {
        var submissions = new java.util.ArrayList<Answer>();
        transactions.executeWithoutResult(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            var template = questionRepository.findById(questionId).orElseThrow().getQuestionTemplate();
            for (int lane = 1; lane <= count; lane++) {
                com.quiz_wheelz.entitys.RacePlayer player;
                if (lane <= 2) {
                    player = playerRepository.findById(lane == 1 ? firstId : secondId).orElseThrow();
                    player.setStatus(com.quiz_wheelz.enums.RacePlayerStatus.RACING);
                    player.setPosition(100.0);
                    player.setSpeed(1.0);
                    player.setMovementUpdatedAtEpochMs(T);
                    player.setFinishedAt(null);
                    player.setFinishedAtEpochMs(null);
                } else {
                    player = player(race, "B1 concurrent " + lane, lane, 100.0);
                    entityManager.persist(player);
                }
                stateService.obtainForLockedPlayer(player);
                var question = new com.quiz_wheelz.entitys.PlayerQuestion();
                question.setRacePlayer(player);
                question.setQuestionTemplate(template);
                question.setQuestionText("1 + 1");
                question.setCorrectAnswerValue(2);
                question.setTimeLimitSeconds(30);
                question.setExpiresAt(local(T + 30000));
                entityManager.persist(question);
                var choice = new com.quiz_wheelz.entitys.PlayerQuestionChoice();
                choice.setPlayerQuestion(question);
                choice.setChoiceText("2");
                choice.setAnswerValue(2);
                choice.setCorrect(true);
                choice.setDisplayOrder(1);
                entityManager.persist(choice);
                submissions.add(new Answer(player.getId(), question.getId(), choice.getId()));
            }
        });
        var ready = new java.util.concurrent.CountDownLatch(count);
        try (var evidence = new com.quiz_wheelz.support.LuckLoadEvidence("same-race-" + count,
                source.unwrap(com.zaxxer.hikari.HikariDataSource.class), resources);
             var executor = java.util.concurrent.Executors.newFixedThreadPool(count)) {
            var futures = new java.util.ArrayList<java.util.concurrent.Future<?>>();
            for (var submission : submissions) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    assertTrue(ready.await(10, java.util.concurrent.TimeUnit.SECONDS));
                    long started = System.nanoTime();
                    var response = submitConcurrent(submission);
                    evidence.completed(started);
                    return response;
                }));
            }
            for (var future : futures) assertNotNull(future.get(30, java.util.concurrent.TimeUnit.SECONDS));
        }
        transactions.executeWithoutResult(status -> {
            var sequence = new java.util.ArrayList<Long>();
            for (var submission : submissions) {
                var history = decisions.findByRacePlayerIdOrderByDecisionSequenceAsc(submission.playerId());
                assertEquals(1, history.size());
                assertEquals(T, history.getFirst().getDecidedAtEpochMs());
                sequence.add(history.getFirst().getDecisionSequence());
                var state = stateRepository.findByRacePlayerId(submission.playerId()).orElseThrow();
                assertEquals(20, state.getChallengeEnergy());
                assertEquals(1, state.getLuckRollsTaken());
                assertEquals(0, state.getGuardShieldCharges());
                assertEquals(10, playerRepository.findById(submission.playerId()).orElseThrow().getScore());
            }
            sequence.sort(Long::compareTo);
            assertEquals(java.util.stream.LongStream.rangeClosed(1, count).boxed().toList(), sequence);
        });
        assertEquals(count, eventTypes().stream().filter(type ->
                type == com.quiz_wheelz.enums.RaceLiveEventType.QUESTION_ANSWERED).count());
        org.mockito.Mockito.verify(random, org.mockito.Mockito.times(count)).nextDouble();
    }

    @org.junit.jupiter.api.Test
    void publicReplayWithPinnedOldSnapshotCannotRepeatAcceptedAnswer() throws Exception {
        var answer = new Answer(secondId, questionId, request(true).getChoiceId());
        var pinned = new java.util.concurrent.CountDownLatch(1);
        var committed = new java.util.concurrent.CountDownLatch(1);
        try (var executor = java.util.concurrent.Executors.newSingleThreadExecutor()) {
            var replay = executor.submit(() -> transactions.execute(status -> {
                assertFalse(decisions.existsByRacePlayerIdAndSourceQuestionId(secondId, questionId));
                pinned.countDown();
                try {
                    assertTrue(committed.await(10, java.util.concurrent.TimeUnit.SECONDS));
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(error);
                }
                assertFalse(decisions.existsByRacePlayerIdAndSourceQuestionId(secondId, questionId));
                var failure = assertThrows(com.quiz_wheelz.exception.ApiException.class, () -> submitConcurrent(answer));
                assertEquals(com.quiz_wheelz.exception.ErrorCode.QUESTION_NOT_ACTIVE, failure.getErrorCode());
                return true;
            }));
            assertTrue(pinned.await(10, java.util.concurrent.TimeUnit.SECONDS));
            try {
                assertNotNull(submitConcurrent(answer));
            } finally {
                committed.countDown();
            }
            assertTrue(replay.get(20, java.util.concurrent.TimeUnit.SECONDS));
        }
        assertEquals(1, history().size());
        assertEquals(1, gameplay().getLuckRollsTaken());
        assertEquals(20, energy());
        assertEquals(10, second().getScore());
        assertEquals(1, second().getCorrectAnswers());
        assertEquals(1, eventTypes().stream().filter(type -> type == com.quiz_wheelz.enums.RaceLiveEventType.QUESTION_ANSWERED).count());
        org.mockito.Mockito.verify(random, org.mockito.Mockito.times(1)).nextDouble();
    }

    @org.junit.jupiter.api.Test
    void simultaneousSameQuestionAcceptsOnceAndConsumesOneDraw() throws Exception {
        var answer = new Answer(secondId, questionId, request(true).getChoiceId());
        var ready = new java.util.concurrent.CountDownLatch(2);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var futures = new java.util.ArrayList<java.util.concurrent.Future<Boolean>>();
            for (int index = 0; index < 2; index++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    assertTrue(ready.await(10, java.util.concurrent.TimeUnit.SECONDS));
                    try {
                        submitConcurrent(answer);
                        return true;
                    } catch (com.quiz_wheelz.exception.ApiException error) {
                        assertEquals(com.quiz_wheelz.exception.ErrorCode.QUESTION_NOT_ACTIVE, error.getErrorCode());
                        return false;
                    }
                }));
            }
            int accepted = 0;
            for (var future : futures) if (future.get(20, java.util.concurrent.TimeUnit.SECONDS)) accepted++;
            assertEquals(1, accepted);
        }
        assertEquals(1, history().size());
        org.mockito.Mockito.verify(random, org.mockito.Mockito.times(1)).nextDouble();
    }

    private com.quiz_wheelz.dto.answer.SubmitAnswerResponse submitConcurrent(Answer answer) {
        var race = new com.quiz_wheelz.entitys.Race();
        race.setId(raceId);
        var player = new com.quiz_wheelz.entitys.RacePlayer();
        player.setId(answer.playerId());
        player.setRace(race);
        var request = new com.quiz_wheelz.dto.answer.SubmitAnswerRequest();
        request.setQuestionId(answer.questionId());
        request.setChoiceId(answer.choiceId());
        return answerService.submitAnswer(player, request);
    }

    private record Answer(long playerId, long questionId, long choiceId) {
    }
}
