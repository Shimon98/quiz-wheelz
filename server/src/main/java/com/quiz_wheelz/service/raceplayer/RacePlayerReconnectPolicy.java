package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRuntimeRules;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class RacePlayerReconnectPolicy {

    public boolean isLastHeartbeatInsideGrace(
            LocalDateTime lastHeartbeatAt,
            LocalDateTime now
    ) {
        if (lastHeartbeatAt == null || now == null) {
            return false;
        }

        return !lastHeartbeatAt
                .plus(RacePlayerRuntimeRules.RECONNECT_GRACE_PERIOD)
                .isBefore(now);
    }

    public boolean isReconnectWindowExpired(
            Optional<LocalDateTime> lastHeartbeatAt,
            LocalDateTime raceStartedAt,
            LocalDateTime now
    ) {
        if (lastHeartbeatAt == null
                || lastHeartbeatAt.isEmpty()
                || raceStartedAt == null
                || now == null) {
            return false;
        }

        LocalDateTime activityReferenceAt =
                laterOf(lastHeartbeatAt.get(), raceStartedAt);

        return !isLastHeartbeatInsideGrace(activityReferenceAt, now);
    }

    private LocalDateTime laterOf(
            LocalDateTime first,
            LocalDateTime second
    ) {
        return first.isAfter(second) ? first : second;
    }
}
