package com.quiz_wheelz.service.teacher;

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
class TeacherRaceLiveStreamRegistryTest {

    @Mock
    private TeacherRaceLiveEmitterFactory emitterFactory;

    @Mock
    private SseEmitter firstEmitter;

    @Mock
    private SseEmitter secondEmitter;

    private TeacherRaceLiveStreamRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new TeacherRaceLiveStreamRegistry(
                emitterFactory,
                Clock.fixed(Instant.ofEpochMilli(1_000L), ZoneOffset.UTC)
        );
    }

    @Test
    void sameRaceConnectionsHaveServerIdsAndIndependentCursors() {
        when(emitterFactory.create()).thenReturn(firstEmitter, secondEmitter);

        TeacherRaceLiveConnection first = registry.register(12L, 3L);
        TeacherRaceLiveConnection second = registry.register(12L, 7L);

        assertNotEquals(first.connectionId(), second.connectionId());
        assertEquals(3L, first.lastDeliveredVersion());
        assertEquals(7L, second.lastDeliveredVersion());
        assertEquals(2, registry.size());
        assertEquals(List.of(first, second).stream().map(TeacherRaceLiveConnection::raceId).toList(),
                registry.activeConnections().stream().map(TeacherRaceLiveConnection::raceId).toList());
    }

    @Test
    void completionRemovesConnectionAndDuplicateCleanupIsSafe() {
        when(emitterFactory.create()).thenReturn(firstEmitter);
        TeacherRaceLiveConnection connection = registry.register(12L, 0L);
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
        TeacherRaceLiveConnection connection = registry.register(12L, 0L);
        ArgumentCaptor<Runnable> callback = ArgumentCaptor.forClass(Runnable.class);
        verify(firstEmitter).onTimeout(callback.capture());

        callback.getValue().run();

        assertFalse(registry.contains(connection.connectionId()));
    }

    @Test
    void errorRemovesConnection() {
        when(emitterFactory.create()).thenReturn(firstEmitter);
        TeacherRaceLiveConnection connection = registry.register(12L, 0L);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Consumer<Throwable>> callback =
                ArgumentCaptor.forClass(Consumer.class);
        verify(firstEmitter).onError(callback.capture());

        callback.getValue().accept(new IllegalStateException());

        assertFalse(registry.contains(connection.connectionId()));
        assertTrue(registry.activeConnections().isEmpty());
    }
}
