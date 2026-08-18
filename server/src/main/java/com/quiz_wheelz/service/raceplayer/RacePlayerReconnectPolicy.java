package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRuntimeRules;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class RacePlayerReconnectPolicy {

    public boolean isActivityReferenceInsideGrace(
            LocalDateTime activityReferenceAt,
            LocalDateTime now
    ) {
        if (activityReferenceAt == null || now == null) {
            return false;
        }

        return !activityReferenceAt
                .plus(RacePlayerRuntimeRules.RECONNECT_GRACE_PERIOD)
                .isBefore(now);
    }

    public boolean isActivityReferenceInsideGrace(
            LocalDateTime activityReferenceAt,
            LocalDateTime now,
            boolean useDbFallbackMargin
    ) {
        if (activityReferenceAt == null || now == null) {
            return false;
        }

        LocalDateTime expiresAt = activityReferenceAt
                .plus(RacePlayerRuntimeRules.RECONNECT_GRACE_PERIOD);

        if (useDbFallbackMargin) {
            expiresAt = expiresAt.plus(
                    RacePlayerRuntimeRules.LAST_SEEN_DB_CHECKPOINT_INTERVAL
            );
        }

        return !expiresAt.isBefore(now);
    }

    public boolean isReconnectWindowExpired(
            Optional<LocalDateTime> lastHeartbeatAt,
            LocalDateTime durableLastSeenAt,
            LocalDateTime raceStartedAt,
            LocalDateTime now
    ) {
        if (now == null) {
            return false;
        }

        LocalDateTime activityReferenceAt = laterOfNullable(
                lastHeartbeatAt.orElse(null),
                durableLastSeenAt,
                raceStartedAt
        );

        if (activityReferenceAt == null) {
            return false;
        }

        return !isActivityReferenceInsideGrace(
                activityReferenceAt,
                now,
                lastHeartbeatAt.isEmpty()
        );
    }

    private LocalDateTime laterOfNullable(LocalDateTime... timestamps) {
        LocalDateTime latest = null;

        for (LocalDateTime timestamp : timestamps) {
            if (timestamp != null && (latest == null || timestamp.isAfter(latest))) {
                latest = timestamp;
            }
        }

        return latest;
    }
}
