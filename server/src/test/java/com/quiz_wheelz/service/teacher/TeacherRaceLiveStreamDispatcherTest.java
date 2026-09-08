package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.common.TeacherRaceLiveStreamRules;
import com.quiz_wheelz.dto.liveevent.QuestionAnsweredLiveEventPayload;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.service.liveevent.RaceLiveEventReplayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceLiveStreamDispatcherTest {

    @Mock
    private TeacherRaceLiveStreamRegistry registry;

    @Mock
    private RaceLiveEventReplayService replayService;

    private MutableClock clock;
    private TeacherRaceLiveStreamDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(1_000L);
        dispatcher = new TeacherRaceLiveStreamDispatcher(registry, replayService, clock);
    }

    @Test
    void ascendingDurableEventsUseVersionsAsIdsAndExistingEnvelopeAsData() {
        CapturingEmitter emitter = new CapturingEmitter();
        TeacherRaceLiveConnection connection = connection(12L, 2L, emitter);
        RaceLiveEventEnvelope<RaceLiveEventPayload> third = event(12L, 3L);
        RaceLiveEventEnvelope<RaceLiveEventPayload> fourth = event(12L, 4L);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replayService.readNextBatch(12L, 2L)).thenReturn(List.of(third, fourth));

        dispatcher.dispatchConnection(connection);

        assertEquals(4L, connection.lastDeliveredVersion());
        assertEquals(2, emitter.frames.size());
        assertEventFrame(emitter.frames.get(0), "3", third);
        assertEventFrame(emitter.frames.get(1), "4", fourth);
    }

    @Test
    void failedSendDoesNotAdvanceAndRemovesConnection() {
        FailingEmitter emitter = new FailingEmitter();
        TeacherRaceLiveConnection connection = connection(12L, 2L, emitter);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replayService.readNextBatch(12L, 2L)).thenReturn(List.of(event(12L, 3L)));

        dispatcher.dispatchConnection(connection);

        assertEquals(2L, connection.lastDeliveredVersion());
        verify(registry).remove(connection.connectionId());
    }

    @Test
    void heartbeatIsACommentWithoutIdPayloadOrCursorAdvance() {
        CapturingEmitter emitter = new CapturingEmitter();
        TeacherRaceLiveConnection connection = connection(12L, 5L, emitter);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replayService.readNextBatch(12L, 5L)).thenReturn(List.of());
        clock.setMillis(1_000L + TeacherRaceLiveStreamRules.HEARTBEAT_INTERVAL_MS);

        dispatcher.dispatchConnection(connection);

        assertEquals(5L, connection.lastDeliveredVersion());
        assertEquals(1, emitter.frames.size());
        List<Object> data = frameData(emitter.frames.getFirst());
        String controlData = textData(data);
        assertTrue(controlData.contains(":" + TeacherRaceLiveStreamRules.HEARTBEAT_COMMENT));
        assertFalse(controlData.contains("id:"));
        assertFalse(data.stream().anyMatch(RaceLiveEventEnvelope.class::isInstance));
    }

    @Test
    void sameRaceConnectionsKeepIndependentCursors() {
        CapturingEmitter firstEmitter = new CapturingEmitter();
        CapturingEmitter secondEmitter = new CapturingEmitter();
        TeacherRaceLiveConnection first = connection(12L, 0L, firstEmitter);
        TeacherRaceLiveConnection second = connection(12L, 1L, secondEmitter);
        when(registry.contains(first.connectionId())).thenReturn(true);
        when(registry.contains(second.connectionId())).thenReturn(true);
        when(replayService.readNextBatch(12L, 0L))
                .thenReturn(List.of(event(12L, 1L), event(12L, 2L)));
        when(replayService.readNextBatch(12L, 1L))
                .thenReturn(List.of(event(12L, 2L)));

        dispatcher.dispatchConnection(first);
        dispatcher.dispatchConnection(second);

        assertEquals(2L, first.lastDeliveredVersion());
        assertEquals(2L, second.lastDeliveredVersion());
        assertEquals(2, firstEmitter.frames.size());
        assertEquals(1, secondEmitter.frames.size());
    }

    @Test
    void differentRacesAreQueriedAndDeliveredInIsolation() {
        CapturingEmitter firstEmitter = new CapturingEmitter();
        CapturingEmitter secondEmitter = new CapturingEmitter();
        TeacherRaceLiveConnection first = connection(12L, 0L, firstEmitter);
        TeacherRaceLiveConnection second = connection(13L, 0L, secondEmitter);
        when(registry.contains(first.connectionId())).thenReturn(true);
        when(registry.contains(second.connectionId())).thenReturn(true);
        RaceLiveEventEnvelope<RaceLiveEventPayload> raceTwelve = event(12L, 1L);
        RaceLiveEventEnvelope<RaceLiveEventPayload> raceThirteen = event(13L, 1L);
        when(replayService.readNextBatch(12L, 0L)).thenReturn(List.of(raceTwelve));
        when(replayService.readNextBatch(13L, 0L)).thenReturn(List.of(raceThirteen));

        dispatcher.dispatchConnection(first);
        dispatcher.dispatchConnection(second);

        assertSame(raceTwelve, envelopeFrom(firstEmitter.frames.getFirst()));
        assertSame(raceThirteen, envelopeFrom(secondEmitter.frames.getFirst()));
    }

    @Test
    void eventCommittedDuringAnEarlierCycleIsDeliveredOnTheNextTickWithoutLoss() {
        CapturingEmitter emitter = new CapturingEmitter();
        TeacherRaceLiveConnection connection = connection(12L, 0L, emitter);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replayService.readNextBatch(12L, 0L))
                .thenReturn(List.of(), List.of(event(12L, 1L)));

        dispatcher.dispatchConnection(connection);
        dispatcher.dispatchConnection(connection);

        assertEquals(1L, connection.lastDeliveredVersion());
        assertEquals(1, emitter.frames.size());
        verify(replayService, org.mockito.Mockito.times(2)).readNextBatch(12L, 0L);
    }

    @Test
    void inactiveConnectionIsNotQueried() {
        TeacherRaceLiveConnection connection = connection(12L, 0L, new CapturingEmitter());
        when(registry.contains(connection.connectionId())).thenReturn(false);

        dispatcher.dispatchConnection(connection);

        verify(replayService, never()).readNextBatch(12L, 0L);
    }

    @Test
    void overlappingDispatchCannotReplaySendOrAdvanceTheSameConnectionTwice()
            throws Exception {
        CapturingEmitter emitter = new CapturingEmitter();
        TeacherRaceLiveConnection connection = connection(12L, 0L, emitter);
        RaceLiveEventEnvelope<RaceLiveEventPayload> first = event(12L, 1L);
        CountDownLatch replayEntered = new CountDownLatch(1);
        CountDownLatch releaseReplay = new CountDownLatch(1);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replayService.readNextBatch(12L, 0L)).thenAnswer(invocation -> {
            replayEntered.countDown();
            assertTrue(releaseReplay.await(5, TimeUnit.SECONDS));
            return List.of(first);
        });
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<?> dispatchA = executor.submit(
                    () -> dispatcher.dispatchConnection(connection)
            );
            assertTrue(replayEntered.await(5, TimeUnit.SECONDS));
            Future<?> dispatchB = executor.submit(
                    () -> dispatcher.dispatchConnection(connection)
            );

            dispatchB.get(5, TimeUnit.SECONDS);
            releaseReplay.countDown();
            dispatchA.get(5, TimeUnit.SECONDS);
        } finally {
            releaseReplay.countDown();
            executor.shutdownNow();
        }

        verify(replayService, times(1)).readNextBatch(12L, 0L);
        assertEquals(1, emitter.frames.size());
        assertSame(first, envelopeFrom(emitter.frames.getFirst()));
        assertEquals(1L, connection.lastDeliveredVersion());
    }

    private TeacherRaceLiveConnection connection(
            Long raceId,
            long cursor,
            SseEmitter emitter
    ) {
        return new TeacherRaceLiveConnection(
                UUID.randomUUID(),
                raceId,
                emitter,
                cursor,
                1_000L
        );
    }

    private RaceLiveEventEnvelope<RaceLiveEventPayload> event(Long raceId, Long version) {
        return new RaceLiveEventEnvelope<>(
                raceId,
                version,
                RaceLiveEventType.QUESTION_ANSWERED,
                1_000L + version,
                new QuestionAnsweredLiveEventPayload(1L, 2L, true)
        );
    }

    private void assertEventFrame(
            Set<ResponseBodyEmitter.DataWithMediaType> frame,
            String id,
            RaceLiveEventEnvelope<RaceLiveEventPayload> envelope
    ) {
        List<Object> data = frameData(frame);
        String controlData = textData(data);
        assertTrue(controlData.contains("id:" + id));
        assertTrue(controlData.contains("data:"));
        assertTrue(data.contains(envelope));
        assertFalse(controlData.contains("event:"));
    }

    private RaceLiveEventEnvelope<?> envelopeFrom(
            Set<ResponseBodyEmitter.DataWithMediaType> frame
    ) {
        return frameData(frame).stream()
                .filter(RaceLiveEventEnvelope.class::isInstance)
                .map(RaceLiveEventEnvelope.class::cast)
                .findFirst()
                .orElseThrow();
    }

    private List<Object> frameData(Set<ResponseBodyEmitter.DataWithMediaType> frame) {
        return frame.stream().map(ResponseBodyEmitter.DataWithMediaType::getData).toList();
    }

    private String textData(List<Object> data) {
        return data.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .reduce("", String::concat);
    }

    private static class CapturingEmitter extends SseEmitter {

        private final List<Set<ResponseBodyEmitter.DataWithMediaType>> frames =
                new ArrayList<>();

        @Override
        public void send(SseEventBuilder builder) {
            frames.add(builder.build());
        }
    }

    private static final class FailingEmitter extends SseEmitter {

        @Override
        public void send(SseEventBuilder builder) throws IOException {
            throw new IOException();
        }
    }

    private static final class MutableClock extends Clock {

        private final AtomicLong millis;

        private MutableClock(long millis) {
            this.millis = new AtomicLong(millis);
        }

        private void setMillis(long value) {
            millis.set(value);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return Instant.ofEpochMilli(millis.get());
        }
    }
}
