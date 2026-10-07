package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class S4ChallengeChronologyTest extends S4ChallengeIntegrationFixture {
    @Test
    void lateExpirySplitsMovementAtExactBoundaryAndCreatesOneEffect() {
        Long id = openOffer();
        double speed = second().getSpeed();
        double position = second().getPosition();
        clock.set(T + 14_000);
        var snapshot = snapshot();
        assertEquals(position + speed * 4 * 12 + (speed - 0.1) * 4 * 2, second().getPosition(), 0.00001);
        assertEquals(speed, second().getSpeed());
        assertEquals(50, energy());
        assertEquals(ChallengeOfferStatus.EXPIRED, offer(id).getStatus());
        assertEquals(T + 12_000, offer(id).getResolvedAtEpochMs());
        assertEquals(RacePlayerGameplayMode.NORMAL, snapshot.getGameplay().mode());
        assertNull(snapshot.getGameplay().challenge().offer());
        var effect = effects().getFirst();
        assertEquals(EffectType.SPEED_SLOW, effect.getType());
        assertEquals(EffectSource.CHALLENGE_TIMEOUT, effect.getSource());
        assertEquals(1, effect.getMagnitudeTenths());
        assertEquals(T + 12_000, effect.getStartsAtEpochMs());
        assertEquals(T + 16_000, effect.getEndsAtEpochMs());
        snapshot();
        assertEquals(1, effects().size());
    }

    @Test
    void oneShotAndPartitionedSettlementAgreeIncludingEndBoundary() {
        Long id = openOffer();
        double initial = second().getPosition();
        double speed = second().getSpeed();
        for (long offset : new long[]{8_000, 12_000, 14_000, 16_000, 20_000}) {
            clock.set(T + offset);
            var state = snapshot();
            assertEquals(offset >= 12_000 && offset < 16_000 ? 1 : 0,
                    state.getGameplay().activeEffects().size());
        }
        double partitioned = second().getPosition();
        transactions.executeWithoutResult(status -> {
            var player = locked();
            player.setPosition(initial);
            player.setMovementUpdatedAtEpochMs(T);
            var offer = offerRepository.findById(id).orElseThrow();
            offer.setStatus(ChallengeOfferStatus.ACTIVE);
            offer.setResolvedAtEpochMs(null);
            effectRepository.deleteAll(effects());
            stateRepository.findByRacePlayerId(secondId).orElseThrow().setChallengeEnergy(0);
        });
        snapshot();
        assertEquals(partitioned, second().getPosition());
        assertEquals(initial + speed * 4 * 16 + (speed - 0.1) * 4 * 4, partitioned, 0.00001);
    }

    @Test
    void offerExpiresBeyondOfflineCutoffWithoutMovingOrReplayingPenalty() {
        Long id = openOffer();
        double initial = second().getPosition();
        double speed = second().getSpeed();
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(raceId, secondId))
                .thenReturn(Optional.of(Instant.ofEpochMilli(T + 8_000)));
        clock.set(T + 20_000);
        reconnect.reconnect(secondRequest);
        assertEquals(initial + speed * 4 * 8, second().getPosition(), 0.00001);
        assertEquals(T + 20_000, second().getMovementUpdatedAtEpochMs());
        assertEquals(50, energy());
        assertEquals(ChallengeOfferStatus.EXPIRED, offer(id).getStatus());
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(true);
        clock.set(T + 21_000);
        var current = snapshot();
        assertTrue(current.getGameplay().activeEffects().isEmpty());
        assertEquals(speed, current.getGameplay().effectiveSpeed());
        assertEquals(T + 12_000, effects().getFirst().getStartsAtEpochMs());
        assertEquals(T + 16_000, effects().getFirst().getEndsAtEpochMs());
    }

    @Test
    void reconnectBeforeExpiryReconstructsChoiceAndPreservesDeadline() {
        Long id = openOffer();
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(false);
        clock.set(T + 6_000);
        reconnect.reconnect(secondRequest);
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(true);
        var snapshot = snapshot();
        assertEquals(RacePlayerGameplayMode.CHALLENGE_CHOICE, snapshot.getGameplay().mode());
        assertEquals(id, snapshot.getGameplay().challenge().offer().offerId());
        assertEquals(T + 12_000, snapshot.getGameplay().challenge().offer().expiresAtEpochMs());
        assertTrue(effects().isEmpty());
    }

    @Test
    void reconnectAfterExpiryBeforeEffectEndHasRemainingEffectOnly() {
        openOffer();
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(false);
        clock.set(T + 14_000);
        reconnect.reconnect(secondRequest);
        when(redisPresenceService.isOnline(raceId, secondId)).thenReturn(true);
        var current = snapshot();
        assertEquals(RacePlayerGameplayMode.NORMAL, current.getGameplay().mode());
        assertEquals(50, current.getGameplay().challenge().energy());
        assertEquals(T + 16_000, current.getGameplay().activeEffects().getFirst().endsAtEpochMs());
    }

    @Test
    void finishBeforeExpiryCancelsWithoutRestoreOrSlowdown() {
        Long id = openOffer();
        secondPosition(999);
        clock.set(T + 14_000);
        var current = snapshot();
        assertEquals(ChallengeOfferStatus.CANCELLED, offer(id).getStatus());
        assertTrue(second().getFinishedAtEpochMs() < T + 12_000);
        assertEquals(0, energy());
        assertTrue(effects().isEmpty());
        assertEquals(RacePlayerGameplayMode.NORMAL, current.getGameplay().mode());
        assertEquals(0.0, current.getMovementUnitsPerSecond());
        assertNull(current.getGameplay().challenge().offer());
    }

    @ParameterizedTest
    @EnumSource(value = RacePlayerStatus.class, names = {"FINISHED", "DISCONNECTED"})
    void terminalPlayerCancelsActiveOffer(RacePlayerStatus playerStatus) {
        Long id = openOffer();
        transactions.executeWithoutResult(status -> locked().setStatus(playerStatus));
        var current = snapshot();
        assertEquals(ChallengeOfferStatus.CANCELLED, offer(id).getStatus());
        assertEquals(0, energy());
        assertTrue(effects().isEmpty());
        assertNull(current.getGameplay().challenge().offer());
        assertEquals(RacePlayerGameplayMode.NORMAL, current.getGameplay().mode());
    }

    @Test
    void terminalRaceCancelsActiveOffer() {
        Long id = openOffer();
        transactions.executeWithoutResult(status -> raceRepository.findById(raceId)
                .orElseThrow().setStatus(RaceStatus.FINISHED));
        assertNull(snapshot().getGameplay().challenge().offer());
        assertEquals(ChallengeOfferStatus.CANCELLED, offer(id).getStatus());
        assertEquals(0, energy());
        assertTrue(effects().isEmpty());
    }

    @Test
    void expiryRollbackRestoresOfferEnergyMovementAndNoEffect() {
        Long id = openOffer();
        double initial = second().getPosition();
        clock.set(T + 14_000);
        transactions.executeWithoutResult(status -> {
            snapshot();
            status.setRollbackOnly();
        });
        assertEquals(ChallengeOfferStatus.ACTIVE, offer(id).getStatus());
        assertEquals(0, energy());
        assertEquals(initial, second().getPosition());
        assertTrue(effects().isEmpty());
    }

    private List<RacePlayerSpeedEffect> effects() {
        return transactions.execute(status -> effectRepository.findOverlapping(secondId, T, T + 30_000));
    }
}
