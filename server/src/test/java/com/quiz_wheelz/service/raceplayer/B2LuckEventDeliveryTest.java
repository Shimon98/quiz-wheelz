package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventSignal;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.service.liveevent.RaceLiveEventReplayService;
import com.quiz_wheelz.service.livestream.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Import(RaceLiveEventReplayService.class)
class B2LuckEventDeliveryTest extends B2LuckIntegrationFixture {
    @Autowired RaceLiveEventReplayService replay;

    @ParameterizedTest
    @ValueSource(strings = {"SHIELD", "BLOCKED", "TAILWIND", "ORB", "MUD"})
    void answerSnapshotAndExistingSignalAreAtomicReplayableAndRefreshable(String scenario) throws Exception {
        prepare(scenario);
        if (scenario.equals("BLOCKED")) {
            transactions.executeWithoutResult(status -> {
                var player = playerRepository.findById(secondId).orElseThrow();
                player.setSpeed(.5);
                player.setStreak(0);
            });
        }
        var beforePlayer = second();
        long before = race().getLiveEventVersion();
        var factory = mock(RaceLiveEmitterFactory.class);
        var frames = new ArrayList<CapturingEmitter>();
        when(factory.create()).thenAnswer(call -> {
            var emitter = new CapturingEmitter();
            frames.add(emitter);
            return emitter;
        });
        var registry = new RaceLiveStreamRegistry(factory, clock);
        var dispatcher = new StudentRaceLiveStreamDispatcher(registry, replay, clock);
        var connection = registry.register(RaceLiveStreamAudience.STUDENT, raceId, before);
        var pending = new CountDownLatch(1);
        var commit = new CountDownLatch(1);
        try (var executor = Executors.newSingleThreadExecutor()) {
            var writing = executor.submit(() -> transactions.execute(status -> {
                var accepted = submit(scenario.equals("SHIELD")).getRaceImpact().getSnapshot();
                entityManager.flush();
                pending.countDown();
                await(commit);
                return accepted;
            }));
            assertTrue(pending.await(15, TimeUnit.SECONDS));
            try {
                dispatcher.dispatchConnection(connection);
                assertEquals(before, connection.lastDeliveredVersion());
                assertTrue(frames.getFirst().signals.isEmpty());
            } finally {
                commit.countDown();
            }
            var accepted = writing.get(20, TimeUnit.SECONDS);
            dispatcher.dispatchConnection(connection);
            var signals = List.copyOf(frames.getFirst().signals);
            assertEquals(java.util.stream.LongStream.rangeClosed(before + 1, accepted.getEventVersion()).boxed().toList(),
                    signals.stream().map(RaceLiveEventSignal::version).toList());
            assertEquals(1, signals.stream().filter(signal -> signal.type() == RaceLiveEventType.QUESTION_ANSWERED).count());
            assertEquals(RaceLiveEventType.QUESTION_ANSWERED, signals.getFirst().type());
            assertEquals(scenario.equals("BLOCKED") ? List.of(RaceLiveEventType.QUESTION_ANSWERED)
                            : List.of(RaceLiveEventType.QUESTION_ANSWERED, RaceLiveEventType.PLAYER_PROGRESS_UPDATED),
                    signals.stream().map(RaceLiveEventSignal::type).toList());
            if (scenario.equals("BLOCKED")) {
                assertEquals(beforePlayer.getPosition(), accepted.getPosition());
                assertEquals(beforePlayer.getSpeed(), accepted.getSpeed());
                assertEquals(beforePlayer.getScore(), accepted.getScore());
                assertEquals(0, accepted.getGameplay().powerUps().guardShieldCharges());
                assertEquals(com.quiz_wheelz.enums.LuckOutcome.BLOCKED_BY_SHIELD,
                        accepted.getGameplay().luck().recentEvents().getFirst().outcome());
            }
            var refreshed = snapshot();
            assertEquals(accepted.getGameplay(), refreshed.getGameplay());
            assertEquals(accepted.getEventVersion(), refreshed.getEventVersion());
            assertEquals(accepted.getEventVersion(), connection.lastDeliveredVersion());
            dispatcher.dispatchConnection(connection);
            assertEquals(signals, frames.getFirst().signals);
            long questionVersion = signals.getFirst().version();
            long cursor = new RaceLiveStreamCursorResolver().resolve(Long.toString(questionVersion), "0", accepted.getEventVersion());
            var resumed = registry.register(RaceLiveStreamAudience.STUDENT, raceId, cursor);
            dispatcher.dispatchConnection(resumed);
            assertEquals(signals.stream().filter(signal -> signal.version() > questionVersion).toList(), frames.get(1).signals);
            var late = registry.register(RaceLiveStreamAudience.STUDENT, raceId, before);
            dispatcher.dispatchConnection(late);
            assertEquals(signals, frames.get(2).signals);
            assertEquals(accepted.getGameplay(), snapshot().getGameplay());
            var trace = Map.of("scenario", scenario, "beforeVersion", before, "snapshotVersion", accepted.getEventVersion(),
                    "visibleBeforeCommit", false, "signals", signals, "resumedSignals", frames.get(1).signals,
                    "gameplay", accepted.getGameplay());
            var dialect = entityManager.getEntityManagerFactory().unwrap(org.hibernate.engine.spi.SessionFactoryImplementor.class)
                    .getJdbcServices().getDialect().getClass().getSimpleName();
            Files.writeString(Path.of("target", "b2-sse-" + scenario + "-" + dialect + ".json"),
                    new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(trace));
        }
        if (scenario.equals("SHIELD")) verifyNoInteractions(random);
        else verify(random, times(2)).nextDouble();
    }

    @Test
    void rolledBackAnswerLeavesNoCommittedGhostSignalOrGameplay() {
        prepare("TAILWIND");
        long before = race().getLiveEventVersion();
        assertThrows(IllegalStateException.class, () -> transactions.executeWithoutResult(status -> {
            submit(false);
            entityManager.flush();
            throw new IllegalStateException("injected B2 rollback");
        }));
        assertTrue(replay.readNextSignalBatch(raceId, before).isEmpty());
        assertEquals(before, race().getLiveEventVersion());
        assertTrue(history().isEmpty());
        assertTrue(snapshot().getGameplay().luck().recentEvents().isEmpty());
        assertTrue(snapshot().getGameplay().activeEffects().isEmpty());
    }

    private static void await(CountDownLatch latch) {
        try {
            assertTrue(latch.await(15, TimeUnit.SECONDS));
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(error);
        }
    }

    private static class CapturingEmitter extends SseEmitter {
        final List<RaceLiveEventSignal> signals = new ArrayList<>();

        @Override
        public void send(SseEventBuilder builder) {
            var data = builder.build();
            for (var item : data) {
                if (item.getData() instanceof RaceLiveEventSignal signal) {
                    assertTrue(data.stream().map(ResponseBodyEmitter.DataWithMediaType::getData)
                            .anyMatch(value -> value instanceof String text && text.contains("id:" + signal.version())));
                    signals.add(signal);
                }
            }
        }
    }
}
