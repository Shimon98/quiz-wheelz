package com.quiz_wheelz.service.raceplayer;

final class RacePlayerRuntimeLogMessages {

    static final String REDIS_DURABLE_FALLBACK =
            "Unable to {} in Redis for raceId={} racePlayerId={}; using durable state";
    static final String RESOLVE_PRESENCE_FAILED =
            "Unable to resolve gameplay presence in Redis for raceId={} racePlayerId={}; failing open";
    static final String RECORD_ACTIVITY_FAILED =
            "Unable to record gameplay activity in Redis for raceId={} racePlayerId={}; durable activity remains authoritative";
    static final String MARK_OFFLINE_FAILED =
            "Unable to clear gameplay presence in Redis for raceId={} racePlayerId={}; durable status remains authoritative";
    static final String READ_HEARTBEAT = "read heartbeat";
    static final String REFRESH_HEARTBEAT = "refresh heartbeat";
    static final String ACQUIRE_CHECKPOINT_GATE = "acquire checkpoint gate";
    static final String RELEASE_CHECKPOINT_GATE = "release failed checkpoint gate";

    private RacePlayerRuntimeLogMessages() {
    }
}
