package com.quiz_wheelz.dto.liveevent;

import com.quiz_wheelz.enums.RaceLiveEventType;

import java.util.Objects;

public record RaceLiveEventEnvelope<T extends RaceLiveEventPayload>(
        Long raceId,
        Long version,
        RaceLiveEventType type,
        Long occurredAtEpochMs,
        T payload
) {

    public RaceLiveEventEnvelope {
        Objects.requireNonNull(raceId);
        Objects.requireNonNull(version);
        Objects.requireNonNull(type);
        Objects.requireNonNull(occurredAtEpochMs);
        Objects.requireNonNull(payload);
    }
}
