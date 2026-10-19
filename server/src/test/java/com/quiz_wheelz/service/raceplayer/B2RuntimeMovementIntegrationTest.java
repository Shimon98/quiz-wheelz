package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class B2RuntimeMovementIntegrationTest extends S4ChallengeIntegrationFixture {
    @Autowired RaceMovementService movement;
    @Autowired RacePlayerSpeedEffectService effects;
    @Autowired StudentRaceStandingProjectionService projections;

    @ParameterizedTest
    @CsvSource({"2,100", "4,100", "8,100", "2,300", "4,300", "8,300", "2,1000", "4,1000", "8,1000"})
    void projectedPeersOwnSettlementStandingsAndSnapshotsAgreeWithoutPeerWrites(int count, int distance) {
        var ids = participants(count, distance);
        var expected = transactions.execute(status -> {
            locked();
            raceRepository.findLockedById(raceId).orElseThrow();
            var players = playerRepository.findByRaceOrderByLaneNumberAsc(raceRepository.findById(raceId).orElseThrow());
            var projected = projections.projectAt(players, null, T + 5000);
            for (var player : players) {
                assertEquals(distance * .1, player.getPosition());
                if (!player.getId().equals(secondId)) {
                    assertEquals(jakarta.persistence.LockModeType.NONE, entityManager.getLockMode(player));
                }
            }
            return projected;
        });
        clock.set(T + 5000);
        var snapshot = snapshot();
        assertEquals(expected.get(secondId).position(), snapshot.getPosition());
        assertEquals(T + 5000, snapshot.getPositionAtEpochMs());
        assertEquals(1.9, snapshot.getGameplay().effectiveSpeed());
        assertEquals(7.6, snapshot.getMovementUnitsPerSecond());
        assertEquals(1, snapshot.getRank());
        for (var opponent : snapshot.getOpponents()) {
            var projection = expected.get(opponent.getRacePlayerId());
            assertEquals(projection.position(), opponent.getPosition());
            assertEquals(projection.effectiveAtEpochMs(), opponent.getPositionAtEpochMs());
            assertEquals(projection.effectiveSpeed() * 4, opponent.getMovementUnitsPerSecond());
            assertEquals(distance * .1, transactions.execute(status ->
                    playerRepository.findById(opponent.getRacePlayerId()).orElseThrow().getPosition()));
        }
        for (int index = 0; index < ids.size(); index++) {
            long id = ids.get(index);
            double expectedPosition = distance * .1 + (index % 2 == 0 ? 39.6 : 8.8);
            assertEquals(expectedPosition, expected.get(id).position(), .00001);
            transactions.executeWithoutResult(status -> {
                var player = playerRepository.findLockedByIdAndRaceId(id, raceId).orElseThrow();
                raceRepository.findLockedById(raceId).orElseThrow();
                assertFalse(movement.settleTo(player, T + 5000));
                assertEquals(expected.get(id).position(), player.getPosition());
                assertEquals(expected.get(id).effectiveAtEpochMs(), player.getMovementUpdatedAtEpochMs());
            });
        }
    }

    @ParameterizedTest
    @EnumSource(value = EffectType.class, names = {"SPEED_BOOST", "SPEED_SLOW"})
    void ownAndPeerBoundarySnapshotsRestoreBaseAtExactExpiry(EffectType type) {
        participants(2, 1000);
        transactions.executeWithoutResult(status -> {
            effectRepository.deleteAll();
            for (long id : List.of(secondId, firstId)) {
                var player = playerRepository.findById(id).orElseThrow();
                player.setSpeed(1.0);
                var effect = timed(player, type, T + 1000, T + (type == EffectType.SPEED_BOOST ? 5000 : 4000));
                entityManager.persist(effect);
            }
        });
        long end = type == EffectType.SPEED_BOOST ? 5000 : 4000;
        for (long elapsed : new long[]{999, 1000, end - 1, end}) {
            clock.set(T + elapsed);
            var snapshot = snapshot();
            boolean active = elapsed >= 1000 && elapsed < end;
            double speed = active ? (type == EffectType.SPEED_BOOST ? 1.2 : .9) : 1.0;
            assertEquals(speed, snapshot.getGameplay().effectiveSpeed());
            assertEquals(speed * 4, snapshot.getMovementUnitsPerSecond());
            assertEquals(active ? 1 : 0, snapshot.getGameplay().activeEffects().size());
            var peer = snapshot.getOpponents().getFirst();
            assertEquals(snapshot.getPosition(), peer.getPosition());
            assertEquals(snapshot.getPositionAtEpochMs(), peer.getPositionAtEpochMs());
            assertEquals(snapshot.getMovementUnitsPerSecond(), peer.getMovementUnitsPerSecond());
        }
    }

    @Test
    void finishArbitrationSettlesBoostedPeersAtIdenticalEarliestCrossing() {
        participants(2, 1000);
        transactions.executeWithoutResult(status -> {
            effectRepository.deleteAll();
            for (long id : List.of(secondId, firstId)) {
                var player = playerRepository.findById(id).orElseThrow();
                player.setPosition(999.0);
                player.setSpeed(1.0);
                entityManager.persist(timed(player, EffectType.SPEED_BOOST, T, T + 4000));
            }
        });
        clock.set(T + 1000);
        var own = snapshot();
        assertTrue(own.isPlayerFinished());
        assertEquals(T + 209, own.getPlayerFinishedAtEpochMs());
        assertEquals(0.0, own.getMovementUnitsPerSecond());
        assertEquals(1000.0, own.getOpponents().getFirst().getPosition());
        assertEquals(0.0, own.getOpponents().getFirst().getMovementUnitsPerSecond());
        org.mockito.Mockito.when(redisPresenceService.findLastGameplayActivityAt(raceId, firstId))
                .thenReturn(Optional.of(java.time.Instant.ofEpochMilli(T + 1000)));
        var settled = arbitrationService.arbitrate(secondRequest);
        assertEquals(2, settled.getSnapshot().getPlayerCount());
        assertEquals(1, settled.getSnapshot().getRank());
        assertEquals(2, settled.getFinishOrder().getConfirmedFinishers().size());
        for (var finisher : settled.getFinishOrder().getConfirmedFinishers()) {
            assertEquals(T + 209, finisher.getFinishedAtEpochMs());
            assertEquals(1, finisher.getRank());
        }
        transactions.executeWithoutResult(status -> {
            for (long id : List.of(secondId, firstId)) {
                var player = playerRepository.findById(id).orElseThrow();
                assertEquals(T + 209, player.getFinishedAtEpochMs());
                assertEquals(T + 209, player.getMovementUpdatedAtEpochMs());
                assertEquals(1000.0, player.getPosition());
            }
        });
    }

    @Test
    void existingCrossSourceOverlapDefenseRollsBackMixedEffectInsertions() {
        assertThrows(com.quiz_wheelz.exception.ApiException.class, () -> transactions.executeWithoutResult(status -> {
            var player = locked();
            raceRepository.findLockedById(raceId).orElseThrow();
            effects.createBoostForLockedPlayer(player, EffectSource.LUCK_EVENT, 2, T, T + 4000);
            entityManager.flush();
            effects.createSlowdownForLockedPlayer(player, EffectSource.TURBO_FAILURE, 2, T + 1, T + 4001);
        }));
        assertTrue(transactions.execute(status -> effectRepository.findOverlapping(secondId, T, T + 5000).isEmpty()).booleanValue());
    }

    private List<Long> participants(int count, int distance) {
        return transactions.execute(status -> {
            var race = raceRepository.findById(raceId).orElseThrow();
            race.setTotalDistance(distance);
            var ids = new ArrayList<Long>();
            for (int index = 0; index < count; index++) {
                var player = index < 2 ? playerRepository.findById(index == 0 ? secondId : firstId).orElseThrow()
                        : player(race, "B2 player " + index, index + 1, distance * .1);
                if (player.getId() == null) entityManager.persist(player);
                player.setStatus(RacePlayerStatus.RACING);
                player.setPosition(distance * .1);
                player.setSpeed(index % 2 == 0 ? 1.9 : .5);
                player.setMovementUpdatedAtEpochMs(T);
                player.setFinishedAt(null);
                player.setFinishedAtEpochMs(null);
                entityManager.persist(timed(player, index % 2 == 0 ? EffectType.SPEED_BOOST : EffectType.SPEED_SLOW,
                        T + 1000, T + (index % 2 == 0 ? 5000 : 4000)));
                ids.add(player.getId());
            }
            return List.copyOf(ids);
        });
    }

    private RacePlayerSpeedEffect timed(RacePlayer player, EffectType type, long start, long end) {
        var effect = new RacePlayerSpeedEffect();
        effect.setRacePlayer(player);
        effect.setType(type);
        effect.setSource(EffectSource.LUCK_EVENT);
        effect.setMagnitudeTenths(type == EffectType.SPEED_BOOST ? 2 : 1);
        effect.setStartsAtEpochMs(start);
        effect.setEndsAtEpochMs(end);
        return effect;
    }
}
