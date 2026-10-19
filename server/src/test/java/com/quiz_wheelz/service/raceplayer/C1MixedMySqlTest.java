package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@EnabledIfEnvironmentVariable(named = "QUIZWHEELZ_LUCK_MYSQL_TEST_URL",
        matches = "jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/quizwheelz_s4_luck_test")
@Import(RacePlayerHeartbeatService.class)
class C1MixedMySqlTest extends B2LuckIntegrationFixture {
    @Autowired RacePlayerHeartbeatService heartbeat;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        B1LuckAnswerMySqlTest.database(properties);
    }

    @ParameterizedTest
    @ValueSource(strings = {"TAILWIND", "MUD"})
    void concurrentAnswerGetReconnectHeartbeatAndFinishAtExpiryCannotDrawAgain(String scenario) throws Exception {
        prepare(scenario);
        submit(false);
        nextQuestion(T);
        var request = request(false);
        long end = T + (scenario.equals("TAILWIND") ? 4000 : 3000);
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow().setPosition(999.9));
        clock.set(end);
        when(redisPresenceService.findLastGameplayActivityAt(raceId, secondId))
                .thenReturn(Optional.of(java.time.Instant.ofEpochMilli(end)));
        when(redisPresenceService.renewExistingPresenceLease(eq(raceId), eq(secondId), any())).thenReturn(true);
        var ready = new CountDownLatch(8);
        var outcomes = new ArrayList<String>();
        try (var executor = Executors.newFixedThreadPool(8)) {
            var futures = new ArrayList<Future<String>>();
            for (int index = 0; index < 8; index++) {
                int operation = index;
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    assertTrue(ready.await(10, TimeUnit.SECONDS));
                    if (operation == 0) {
                        var failure = assertThrows(ApiException.class, () -> answerService.submitAnswer(second(), request));
                        assertTrue(Set.of(ErrorCode.QUESTION_NOT_ACTIVE, ErrorCode.RACE_PLAYER_NOT_RACING,
                                ErrorCode.QUESTION_EXPIRED).contains(failure.getErrorCode()));
                        return "answer-rejected-" + failure.getErrorCode();
                    }
                    if (operation == 1) { reconnect.reconnect(secondRequest); return "reconnect"; }
                    if (operation == 2) { heartbeat.heartbeat(secondRequest); return "heartbeat"; }
                    if (operation == 3) { arbitrationService.arbitrate(secondRequest); return "arbitrate"; }
                    assertTrue(snapshot().isPlayerFinished());
                    return "GET-terminal";
                }));
            }
            for (var future : futures) outcomes.add(future.get(30, TimeUnit.SECONDS));
        }
        var finalState = snapshot();
        assertEquals(0.0, finalState.getMovementUnitsPerSecond());
        assertTrue(finalState.getGameplay().activeEffects().isEmpty());
        assertEquals(1, finalState.getGameplay().luck().recentEvents().size());
        assertEquals(1, history().size());
        verify(random, times(2)).nextDouble();
        writeExample("C1-MIXED-" + scenario, finalState);
        java.nio.file.Files.writeString(java.nio.file.Path.of("target", "c1-evidence", "mixed-" + scenario + ".json"),
                new com.fasterxml.jackson.databind.ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(outcomes));
    }
}
