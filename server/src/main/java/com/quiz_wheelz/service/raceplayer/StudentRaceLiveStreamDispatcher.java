package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;

import com.quiz_wheelz.service.livestream.RaceLiveStreamConnection;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;

import com.quiz_wheelz.common.RaceLiveStreamRules;
import com.quiz_wheelz.dto.liveevent.RaceLiveEventSignal;
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
public class StudentRaceLiveStreamDispatcher {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(StudentRaceLiveStreamDispatcher.class);
    private static final String REPLAY_FAILURE_LOG =
            "Student live-event replay failed for connectionId={} raceId={}";

    private final RaceLiveStreamRegistry registry;
    private final RaceLiveEventReplayService replayService;
    private final Clock clock;

    public StudentRaceLiveStreamDispatcher(
            RaceLiveStreamRegistry registry,
            RaceLiveEventReplayService replayService,
            Clock clock
    ) {
        this.registry = Objects.requireNonNull(registry);
        this.replayService = Objects.requireNonNull(replayService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Scheduled(
            fixedDelay = RaceLiveStreamRules.DISPATCH_INTERVAL_MS,
            scheduler = RaceLiveStreamRules.SCHEDULER_BEAN_NAME
    )
    public void dispatchActiveConnections() {
        registry.activeConnections(RaceLiveStreamAudience.STUDENT).forEach(this::dispatchConnection);
    }

    public void dispatchConnection(RaceLiveStreamConnection connection) {
        Objects.requireNonNull(connection);
        if (connection.audience() != RaceLiveStreamAudience.STUDENT
                || !registry.contains(connection.connectionId())
                || !connection.tryAcquireDispatch()) {
            return;
        }

        try {
            if (!registry.contains(connection.connectionId())) {
                return;
            }
            List<RaceLiveEventSignal> events;
            try {
                events = replayService.readNextSignalBatch(
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
                registry.remove(connection.connectionId());
                connection.emitter().complete();
                return;
            }

            for (RaceLiveEventSignal event : events) {
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
            RaceLiveStreamConnection connection,
            RaceLiveEventSignal event
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

    private void sendHeartbeatIfDue(RaceLiveStreamConnection connection) {
        long now = clock.millis();
        if (now - connection.lastWriteEpochMs()
                < RaceLiveStreamRules.HEARTBEAT_INTERVAL_MS) {
            return;
        }
        try {
            connection.emitter().send(
                    SseEmitter.event().comment(RaceLiveStreamRules.HEARTBEAT_COMMENT)
            );
            connection.markHeartbeatDelivered(now);
        } catch (IOException | RuntimeException exception) {
            registry.remove(connection.connectionId());
        }
    }
}
