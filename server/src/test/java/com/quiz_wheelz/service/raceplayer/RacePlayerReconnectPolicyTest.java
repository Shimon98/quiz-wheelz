package com.quiz_wheelz.service.raceplayer;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RacePlayerReconnectPolicyTest {

    private final RacePlayerReconnectPolicy policy = new RacePlayerReconnectPolicy();

    @Test
    void lastHeartbeatInsideGraceShouldReturnTrueAtExactGraceBoundary() {
        assertTrue(policy.isLastHeartbeatInsideGrace(
                LocalDateTime.of(2026, 7, 6, 13, 0),
                LocalDateTime.of(2026, 7, 6, 13, 3)
        ));
    }

    @Test
    void lastHeartbeatInsideGraceShouldReturnFalseAfterGraceBoundary() {
        assertFalse(policy.isLastHeartbeatInsideGrace(
                LocalDateTime.of(2026, 7, 6, 13, 0),
                LocalDateTime.of(2026, 7, 6, 13, 3, 1)
        ));
    }

    @Test
    void lastHeartbeatInsideGraceShouldReturnFalseWhenTimestampIsMissing() {
        assertFalse(policy.isLastHeartbeatInsideGrace(
                null,
                LocalDateTime.of(2026, 7, 6, 13, 3)
        ));
    }

    @Test
    void shouldReturnFalseWhenLastHeartbeatIsEmpty() {
        assertFalse(policy.isReconnectWindowExpired(
                Optional.empty(),
                LocalDateTime.of(2026, 7, 6, 13, 0),
                LocalDateTime.of(2026, 7, 6, 13, 5)
        ));
    }

    @Test
    void shouldReturnFalseWhenRaceStartedAtIsNull() {
        assertFalse(policy.isReconnectWindowExpired(
                Optional.of(LocalDateTime.of(2026, 7, 6, 13, 0)),
                null,
                LocalDateTime.of(2026, 7, 6, 13, 5)
        ));
    }

    @Test
    void shouldReturnFalseWhenHeartbeatIsWithinGrace() {
        assertFalse(policy.isReconnectWindowExpired(
                Optional.of(LocalDateTime.of(2026, 7, 6, 13, 2)),
                LocalDateTime.of(2026, 7, 6, 13, 0),
                LocalDateTime.of(2026, 7, 6, 13, 4)
        ));
    }

    @Test
    void shouldReturnFalseWhenRaceStartedAfterOldHeartbeatAndGraceHasNotPassedSinceStart() {
        assertFalse(policy.isReconnectWindowExpired(
                Optional.of(LocalDateTime.of(2026, 7, 6, 12, 55)),
                LocalDateTime.of(2026, 7, 6, 13, 0),
                LocalDateTime.of(2026, 7, 6, 13, 2)
        ));
    }

    @Test
    void shouldReturnTrueWhenLastHeartbeatAfterStartIsOlderThanGrace() {
        assertTrue(policy.isReconnectWindowExpired(
                Optional.of(LocalDateTime.of(2026, 7, 6, 13, 1)),
                LocalDateTime.of(2026, 7, 6, 13, 0),
                LocalDateTime.of(2026, 7, 6, 13, 5, 1)
        ));
    }

    @Test
    void shouldReturnTrueWhenLastHeartbeatBeforeStartButGracePassedSinceRaceStart() {
        assertTrue(policy.isReconnectWindowExpired(
                Optional.of(LocalDateTime.of(2026, 7, 6, 12, 55)),
                LocalDateTime.of(2026, 7, 6, 13, 0),
                LocalDateTime.of(2026, 7, 6, 13, 3, 1)
        ));
    }
}
