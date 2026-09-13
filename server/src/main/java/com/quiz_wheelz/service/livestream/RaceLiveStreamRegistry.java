package com.quiz_wheelz.service.livestream;


import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Clock;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class RaceLiveStreamRegistry {

    private final ConcurrentMap<UUID, RaceLiveStreamConnection> connections =
            new ConcurrentHashMap<>();
    private final RaceLiveEmitterFactory emitterFactory;
    private final Clock clock;

    public RaceLiveStreamRegistry(
            RaceLiveEmitterFactory emitterFactory,
            Clock clock
    ) {
        this.emitterFactory = Objects.requireNonNull(emitterFactory);
        this.clock = Objects.requireNonNull(clock);
    }

    public RaceLiveStreamConnection register(RaceLiveStreamAudience audience, Long raceId, long cursor) {
        SseEmitter emitter = emitterFactory.create();
        RaceLiveStreamConnection connection = new RaceLiveStreamConnection(
                UUID.randomUUID(),
                audience,
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

    public List<RaceLiveStreamConnection> activeConnections(RaceLiveStreamAudience audience) {
        return connections.values().stream()
                .filter(connection -> connection.audience() == audience)
                .toList();
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
