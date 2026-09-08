package com.quiz_wheelz.service.teacher;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Clock;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class TeacherRaceLiveStreamRegistry {

    private final ConcurrentMap<UUID, TeacherRaceLiveConnection> connections =
            new ConcurrentHashMap<>();
    private final TeacherRaceLiveEmitterFactory emitterFactory;
    private final Clock clock;

    public TeacherRaceLiveStreamRegistry(
            TeacherRaceLiveEmitterFactory emitterFactory,
            Clock clock
    ) {
        this.emitterFactory = Objects.requireNonNull(emitterFactory);
        this.clock = Objects.requireNonNull(clock);
    }

    public TeacherRaceLiveConnection register(Long raceId, long cursor) {
        SseEmitter emitter = emitterFactory.create();
        TeacherRaceLiveConnection connection = new TeacherRaceLiveConnection(
                UUID.randomUUID(),
                raceId,
                emitter,
                cursor,
                clock.millis()
        );
        connections.put(connection.connectionId(), connection);
        emitter.onCompletion(() -> remove(connection.connectionId()));
        emitter.onTimeout(() -> remove(connection.connectionId()));
        emitter.onError(error -> remove(connection.connectionId()));
        return connection;
    }

    public List<TeacherRaceLiveConnection> activeConnections() {
        return List.copyOf(connections.values());
    }

    public boolean contains(UUID connectionId) {
        return connections.containsKey(connectionId);
    }

    public boolean remove(UUID connectionId) {
        return connections.remove(connectionId) != null;
    }

    public int size() {
        return connections.size();
    }
}
