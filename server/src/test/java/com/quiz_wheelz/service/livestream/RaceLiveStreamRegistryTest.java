package com.quiz_wheelz.service.livestream;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceLiveStreamRegistryTest {

    @Mock
    private RaceLiveEmitterFactory emitterFactory;

    @Mock
    private SseEmitter firstEmitter;

    @Mock
    private SseEmitter secondEmitter;

    private RaceLiveStreamRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new RaceLiveStreamRegistry(
                emitterFactory,
                Clock.fixed(Instant.ofEpochMilli(1_000L), ZoneOffset.UTC)
        );
    }

    @Test
    void audiencesShareStorageWithoutSharingDispatchLists() {
        when(emitterFactory.create()).thenReturn(firstEmitter, secondEmitter);
        var teacher = registry.register(RaceLiveStreamAudience.TEACHER, 12L, 3L);
        var student = registry.register(RaceLiveStreamAudience.STUDENT, 12L, 7L);

        assertEquals(List.of(teacher), registry.activeConnections(RaceLiveStreamAudience.TEACHER));
        assertEquals(List.of(student), registry.activeConnections(RaceLiveStreamAudience.STUDENT));
        assertEquals(2, registry.size());
    }

    @Test
    void sameRaceConnectionsHaveServerIdsAndIndependentCursors() {
        when(emitterFactory.create()).thenReturn(firstEmitter, secondEmitter);

        RaceLiveStreamConnection first = registry.register(RaceLiveStreamAudience.TEACHER, 12L, 3L);
        RaceLiveStreamConnection second = registry.register(RaceLiveStreamAudience.TEACHER, 12L, 7L);

        assertNotEquals(first.connectionId(), second.connectionId());
        assertEquals(3L, first.lastDeliveredVersion());
        assertEquals(7L, second.lastDeliveredVersion());
        assertEquals(2, registry.size());
        assertEquals(List.of(first, second).stream().map(RaceLiveStreamConnection::raceId).toList(),
                registry.activeConnections(RaceLiveStreamAudience.TEACHER).stream().map(RaceLiveStreamConnection::raceId).toList());
    }

    @Test
    void completionRemovesConnectionAndDuplicateCleanupIsSafe() {
        when(emitterFactory.create()).thenReturn(firstEmitter);
        RaceLiveStreamConnection connection = registry.register(RaceLiveStreamAudience.TEACHER, 12L, 0L);
        ArgumentCaptor<Runnable> callback = ArgumentCaptor.forClass(Runnable.class);
        verify(firstEmitter).onCompletion(callback.capture());

        callback.getValue().run();
        callback.getValue().run();

        assertFalse(registry.contains(connection.connectionId()));
        assertFalse(registry.remove(connection.connectionId()));
    }

    @Test
    void timeoutRemovesConnection() {
        when(emitterFactory.create()).thenReturn(firstEmitter);
        RaceLiveStreamConnection connection = registry.register(RaceLiveStreamAudience.TEACHER, 12L, 0L);
        ArgumentCaptor<Runnable> callback = ArgumentCaptor.forClass(Runnable.class);
        verify(firstEmitter).onTimeout(callback.capture());

        callback.getValue().run();

        assertFalse(registry.contains(connection.connectionId()));
    }

    @Test
    void errorRemovesConnection() {
        when(emitterFactory.create()).thenReturn(firstEmitter);
        RaceLiveStreamConnection connection = registry.register(RaceLiveStreamAudience.TEACHER, 12L, 0L);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Consumer<Throwable>> callback =
                ArgumentCaptor.forClass(Consumer.class);
        verify(firstEmitter).onError(callback.capture());

        callback.getValue().accept(new IllegalStateException());

        assertFalse(registry.contains(connection.connectionId()));
        assertTrue(registry.activeConnections(RaceLiveStreamAudience.TEACHER).isEmpty());
    }
}
