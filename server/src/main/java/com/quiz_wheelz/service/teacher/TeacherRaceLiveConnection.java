package com.quiz_wheelz.service.teacher;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

public final class TeacherRaceLiveConnection {

    private final UUID connectionId;
    private final Long raceId;
    private final SseEmitter emitter;
    private final AtomicLong lastDeliveredVersion;
    private final AtomicLong lastWriteEpochMs;
    private final ReentrantLock dispatchLock = new ReentrantLock();

    public TeacherRaceLiveConnection(
            UUID connectionId,
            Long raceId,
            SseEmitter emitter,
            long lastDeliveredVersion,
            long lastWriteEpochMs
    ) {
        this.connectionId = Objects.requireNonNull(connectionId);
        this.raceId = Objects.requireNonNull(raceId);
        this.emitter = Objects.requireNonNull(emitter);
        this.lastDeliveredVersion = new AtomicLong(lastDeliveredVersion);
        this.lastWriteEpochMs = new AtomicLong(lastWriteEpochMs);
    }

    public UUID connectionId() {
        return connectionId;
    }

    public Long raceId() {
        return raceId;
    }

    public SseEmitter emitter() {
        return emitter;
    }

    public long lastDeliveredVersion() {
        return lastDeliveredVersion.get();
    }

    public long lastWriteEpochMs() {
        return lastWriteEpochMs.get();
    }

    public void markEventDelivered(long version, long writeEpochMs) {
        if (version <= lastDeliveredVersion.get()) {
            throw new IllegalArgumentException();
        }
        lastDeliveredVersion.set(version);
        lastWriteEpochMs.set(writeEpochMs);
    }

    public void markHeartbeatDelivered(long writeEpochMs) {
        lastWriteEpochMs.set(writeEpochMs);
    }

    public boolean tryAcquireDispatch() {
        return dispatchLock.tryLock();
    }

    public void releaseDispatch() {
        dispatchLock.unlock();
    }
}
