package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventSignal;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.service.liveevent.RaceLiveEventReplayService;
import com.quiz_wheelz.service.livestream.*;
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
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentRaceLiveStreamDispatcherTest {

    @Mock RaceLiveStreamRegistry registry;
    @Mock RaceLiveEventReplayService replay;
    StudentRaceLiveStreamDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        dispatcher = new StudentRaceLiveStreamDispatcher(registry, replay,
                Clock.fixed(Instant.ofEpochMilli(20_000), ZoneOffset.UTC));
    }

    @Test
    void onlyStudentSignalsAreSentWithDurableIdsAndNoPayload() throws Exception {
        var emitter = new CapturingEmitter();
        var connection = connection(RaceLiveStreamAudience.STUDENT, emitter);
        var signal = new RaceLiveEventSignal(4L, RaceLiveEventType.QUESTION_ANSWERED, 19_000L);
        when(registry.activeConnections(RaceLiveStreamAudience.STUDENT)).thenReturn(List.of(connection));
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replay.readNextSignalBatch(12L, 3L)).thenReturn(List.of(signal));

        dispatcher.dispatchActiveConnections();

        assertEquals(4L, connection.lastDeliveredVersion());
        assertEquals(20_000L, connection.lastWriteEpochMs());
        var data = emitter.frames.getFirst().stream().map(ResponseBodyEmitter.DataWithMediaType::getData).toList();
        assertTrue(data.contains(signal));
        assertTrue(data.stream().anyMatch(value -> value instanceof String text && text.contains("id:4")));
        assertEquals("{\"version\":4,\"type\":\"QUESTION_ANSWERED\",\"occurredAtEpochMs\":19000}",
                new ObjectMapper().writeValueAsString(signal));
        verify(replay, never()).readNextBatch(anyLong(), anyLong());
    }

    @Test
    void teacherConnectionsAreIgnoredEvenWhenPassedDirectly() {
        dispatcher.dispatchConnection(connection(RaceLiveStreamAudience.TEACHER, new CapturingEmitter()));
        verifyNoInteractions(replay, registry);
    }

    @Test
    void heartbeatIsCommentOnlyAndDoesNotAdvanceCursor() {
        var emitter = new CapturingEmitter();
        var connection = connection(RaceLiveStreamAudience.STUDENT, emitter);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replay.readNextSignalBatch(12L, 3L)).thenReturn(List.of());

        dispatcher.dispatchConnection(connection);

        String frame = emitter.frames.getFirst().stream()
                .map(ResponseBodyEmitter.DataWithMediaType::getData).map(Object::toString).reduce("", String::concat);
        assertTrue(frame.contains(":heartbeat"));
        assertFalse(frame.contains("id:"));
        assertFalse(frame.contains("data:"));
        assertEquals(3L, connection.lastDeliveredVersion());
    }

    @Test
    void failedSendRemovesConnectionWithoutAdvancingCursor() throws Exception {
        var emitter = mock(SseEmitter.class);
        doThrow(new IOException()).when(emitter).send(any(SseEmitter.SseEventBuilder.class));
        var connection = connection(RaceLiveStreamAudience.STUDENT, emitter);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replay.readNextSignalBatch(12L, 3L)).thenReturn(List.of(
                new RaceLiveEventSignal(4L, RaceLiveEventType.PLAYER_FINISHED, 19_000L)));

        dispatcher.dispatchConnection(connection);

        verify(registry).remove(connection.connectionId());
        assertEquals(3L, connection.lastDeliveredVersion());
    }

    @Test
    void replayFailureRemovesStudentConnectionAndReleasesDispatchLock() {
        var emitter = mock(SseEmitter.class);
        var connection = connection(RaceLiveStreamAudience.STUDENT, emitter);
        when(registry.contains(connection.connectionId())).thenReturn(true);
        when(replay.readNextSignalBatch(12L, 3L)).thenThrow(new IllegalStateException());

        dispatcher.dispatchConnection(connection);

        verify(registry).remove(connection.connectionId());
        verify(emitter).complete();
        assertTrue(connection.tryAcquireDispatch());
        connection.releaseDispatch();
    }

    private RaceLiveStreamConnection connection(RaceLiveStreamAudience audience, SseEmitter emitter) {
        return new RaceLiveStreamConnection(UUID.randomUUID(), audience, 12L, emitter, 3L, 1_000L);
    }

    private static class CapturingEmitter extends SseEmitter {
        final List<Set<ResponseBodyEmitter.DataWithMediaType>> frames = new ArrayList<>();

        @Override
        public void send(SseEventBuilder builder) {
            frames.add(builder.build());
        }
    }
}
