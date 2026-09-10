package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.common.TeacherRaceLiveStreamRules;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventEnvelope;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventPayload;
import com.quiz_wheelz.service.liveevent.RaceLiveEventReplayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Clock;
import java.util.List;
import java.util.Objects;

@Component
public class TeacherRaceLiveStreamDispatcher {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(TeacherRaceLiveStreamDispatcher.class);
    private static final String REPLAY_FAILURE_LOG =
            "Teacher live-event replay failed for connectionId={} raceId={}";

    private final TeacherRaceLiveStreamRegistry registry;
    private final RaceLiveEventReplayService replayService;
    private final Clock clock;

    public TeacherRaceLiveStreamDispatcher(
            TeacherRaceLiveStreamRegistry registry,
            RaceLiveEventReplayService replayService,
            Clock clock
    ) {
        this.registry = Objects.requireNonNull(registry);
        this.replayService = Objects.requireNonNull(replayService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Scheduled(
            fixedDelay = TeacherRaceLiveStreamRules.DISPATCH_INTERVAL_MS,
            scheduler = TeacherRaceLiveStreamRules.SCHEDULER_BEAN_NAME
    )
    public void dispatchActiveConnections() {
        registry.activeConnections().forEach(this::dispatchConnection);
    }

    public void dispatchConnection(TeacherRaceLiveConnection connection) {
        Objects.requireNonNull(connection);
        if (!registry.contains(connection.connectionId())
                || !connection.tryAcquireDispatch()) {
            return;
        }

        try {
            if (!registry.contains(connection.connectionId())) {
                return;
            }
            List<RaceLiveEventEnvelope<RaceLiveEventPayload>> events;
            try {
                events = replayService.readNextBatch(
                        connection.raceId(),
                        connection.lastDeliveredVersion()
                );
            } catch (RuntimeException exception) {
                LOGGER.warn(
                        REPLAY_FAILURE_LOG,
                        connection.connectionId(),
                        connection.raceId(),
                        exception
                );
                return;
            }

            for (RaceLiveEventEnvelope<RaceLiveEventPayload> event : events) {
                if (!sendEvent(connection, event)) {
                    return;
                }
            }
            sendHeartbeatIfDue(connection);
        } finally {
            connection.releaseDispatch();
        }
    }

    private boolean sendEvent(
            TeacherRaceLiveConnection connection,
            RaceLiveEventEnvelope<RaceLiveEventPayload> event
    ) {
        try {
            connection.emitter().send(
                    SseEmitter.event()
                            .id(Long.toString(event.version()))
                            .data(event)
            );
            connection.markEventDelivered(event.version(), clock.millis());
            return true;
        } catch (IOException | RuntimeException exception) {
            registry.remove(connection.connectionId());
            return false;
        }
    }

    private void sendHeartbeatIfDue(TeacherRaceLiveConnection connection) {
        long now = clock.millis();
        if (now - connection.lastWriteEpochMs()
                < TeacherRaceLiveStreamRules.HEARTBEAT_INTERVAL_MS) {
            return;
        }
        try {
            connection.emitter().send(
                    SseEmitter.event().comment(TeacherRaceLiveStreamRules.HEARTBEAT_COMMENT)
            );
            connection.markHeartbeatDelivered(now);
        } catch (IOException | RuntimeException exception) {
            registry.remove(connection.connectionId());
        }
    }
}
