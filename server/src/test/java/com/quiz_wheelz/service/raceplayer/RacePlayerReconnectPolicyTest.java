package com.quiz_wheelz.service.raceplayer;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RacePlayerReconnectPolicyTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 7, 6, 13, 10);

    private final RacePlayerReconnectPolicy policy = new RacePlayerReconnectPolicy();

    @Test
    void redisHeartbeatAtFiveMinuteBoundaryShouldRemainInsideGrace() {
        assertFalse(expired(Optional.of(NOW.minusMinutes(5)), null, null));
    }

    @Test
    void redisHeartbeatBeyondFiveMinutesShouldExpireWithoutFallbackMargin() {
        assertTrue(expired(Optional.of(NOW.minusMinutes(5).minusSeconds(1)), null, null));
    }

    @Test
    void missingRedisHeartbeatShouldUseRecentDurableLastSeen() {
        assertFalse(expired(Optional.empty(), NOW.minusMinutes(5), null));
    }

    @Test
    void dbOnlyFallbackShouldIncludeThirtySecondSafetyMargin() {
        assertFalse(expired(Optional.empty(), NOW.minusMinutes(5).minusSeconds(30), null));
        assertTrue(expired(Optional.empty(), NOW.minusMinutes(5).minusSeconds(31), null));
    }

    @Test
    void newerDbTimestampShouldWinOverOldRedisTimestamp() {
        assertFalse(expired(
                Optional.of(NOW.minusMinutes(8)),
                NOW.minusMinutes(1),
                NOW.minusMinutes(10)
        ));
    }

    @Test
    void newerRedisTimestampShouldWinOverOldDbTimestamp() {
        assertFalse(expired(
                Optional.of(NOW.minusMinutes(1)),
                NOW.minusMinutes(8),
                NOW.minusMinutes(10)
        ));
    }

    @Test
    void raceStartShouldProtectAgainstOldLobbyActivity() {
        assertFalse(expired(
                Optional.of(NOW.minusMinutes(10)),
                NOW.minusMinutes(10),
                NOW.minusMinutes(1)
        ));
    }

    @Test
    void missingAllActivityReferencesShouldRemainForgiving() {
        assertFalse(expired(Optional.empty(), null, null));
    }

    @Test
    void nullNowShouldNotExpire() {
        assertFalse(policy.isReconnectWindowExpired(
                Optional.of(NOW.minusMinutes(10)),
                NOW.minusMinutes(10),
                NOW.minusMinutes(10),
                null
        ));
    }

    private boolean expired(
            Optional<LocalDateTime> redisHeartbeatAt,
            LocalDateTime durableLastSeenAt,
            LocalDateTime raceStartedAt
    ) {
        return policy.isReconnectWindowExpired(
                redisHeartbeatAt,
                durableLastSeenAt,
                raceStartedAt,
                NOW
        );
    }
}
