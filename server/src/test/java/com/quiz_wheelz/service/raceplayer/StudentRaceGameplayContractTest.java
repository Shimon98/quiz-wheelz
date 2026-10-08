package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.raceplayer.*;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.RacePlayerSpeedEffectRepository;
import com.quiz_wheelz.service.raceengine.*;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudentRaceGameplayContractTest {

    private static final long T = 100000;
    private final RacePlayerSpeedEffectRepository repository = mock(RacePlayerSpeedEffectRepository.class);
    private final StudentRaceGameplayProjectionService gameplayService = new StudentRaceGameplayProjectionService(
            new RacePlayerSpeedEffectService(repository),
            new RaceSpeedEffectMovementCalculator(new RaceMovementCalculator()), new com.quiz_wheelz.service.challenge.StudentChallengeProjectionService(org.mockito.Mockito.mock(com.quiz_wheelz.repository.RacePlayerGameplayStateRepository.class), org.mockito.Mockito.mock(com.quiz_wheelz.service.challenge.ChallengeOfferService.class), org.mockito.Mockito.mock(com.quiz_wheelz.repository.RacePlayerChallengeOfferRepository.class), org.mockito.Mockito.mock(com.quiz_wheelz.service.challenge.ChallengeExecutionStateService.class)));
    private final StudentRaceRuntimeSnapshotService snapshots = new StudentRaceRuntimeSnapshotService(
            new StudentRaceRuntimeSnapshotMapper(), gameplayService);
    private final RacePlayer player = player();

    @Test
    void normalSnapshotPreservesBaseSpeedAndRateWithNonNullGameplay() {
        var snapshot = snapshot(T);
        assertEquals(1.3, snapshot.getSpeed());
        assertEquals(5.2, snapshot.getMovementUnitsPerSecond());
        assertEquals(RacePlayerGameplayMode.NORMAL, snapshot.getGameplay().mode());
        assertEquals(1.3, snapshot.getGameplay().effectiveSpeed());
        assertEquals(List.of(), snapshot.getGameplay().activeEffects());
    }

    @Test
    void activeSlowdownSeparatesEffectiveSpeedFromEarnedBaseSpeed() {
        when(repository.findRelevantForPlayers(List.of(1L), T, T))
                .thenReturn(List.of(effect(41, T, T + 3000, 1)));
        var snapshot = snapshot(T);
        assertEquals(1.3, snapshot.getSpeed());
        assertEquals(1.3, player.getSpeed());
        assertEquals(1.2, snapshot.getGameplay().effectiveSpeed());
        assertEquals(4.8, snapshot.getMovementUnitsPerSecond());
        assertEquals(41L, snapshot.getGameplay().activeEffects().getFirst().effectId());
    }

    @Test
    void answerUsesSameGameplayShapeWithPostAnswerSpeed() {
        when(repository.findRelevantForPlayers(List.of(1L), T, T))
                .thenReturn(List.of(effect(41, T, T + 3000, 1)));
        var impact = new com.quiz_wheelz.dto.raceengine.AnswerRaceImpact(
                1L, 1L, true, 10, 10.0, 60, 130.0, 1.5, 4, 5, 4, 0,
                Difficulty.EASY, Difficulty.MEDIUM, 0, 0, true,
                RacePlayerStatus.RACING, RaceStatus.IN_PROGRESS, false, false);
        var snapshot = snapshots.fromAnswerRaceImpact(impact, player,
                new StudentRaceStandingResult(1, 1, List.of()), T, 12);
        assertEquals(1.5, snapshot.getSpeed());
        assertEquals(1.4, snapshot.getGameplay().effectiveSpeed());
        assertEquals(5.6, snapshot.getMovementUnitsPerSecond());
        assertEquals(41L, snapshot.getGameplay().activeEffects().getFirst().effectId());
    }

    @Test
    void halfOpenIntervalIncludesStartAndExcludesEnd() {
        var effect = effect(41, T, T + 3000, 1);
        when(repository.findRelevantForPlayers(List.of(1L), T, T)).thenReturn(List.of(effect));
        when(repository.findRelevantForPlayers(List.of(1L), T + 3000, T + 3000)).thenReturn(List.of(effect));
        assertEquals(1, snapshot(T).getGameplay().activeEffects().size());
        assertEquals(1.3, snapshot(T + 3000).getGameplay().effectiveSpeed());
        assertTrue(snapshot(T + 3000).getGameplay().activeEffects().isEmpty());
    }

    @Test
    void futureExpiredAndUnsupportedEffectsDoNotAffectGameplay() {
        var unsupported = effect(3, T, T + 3000, 1);
        unsupported.setType(EffectType.SPEED_BOOST);
        when(repository.findRelevantForPlayers(List.of(1L), T, T)).thenReturn(List.of(
                effect(1, T - 1000, T, 1), effect(2, T + 1, T + 3000, 1), unsupported));
        assertEquals(1.3, snapshot(T).getGameplay().effectiveSpeed());
        assertTrue(snapshot(T).getGameplay().activeEffects().isEmpty());
    }

    @Test
    void terminalAndNonMovingStatesExposeZeroEffectiveRateWithoutLookup() {
        for (RaceStatus raceStatus : RaceStatus.values()) {
            for (RacePlayerStatus playerStatus : RacePlayerStatus.values()) {
                if (raceStatus == RaceStatus.IN_PROGRESS && playerStatus == RacePlayerStatus.RACING) {
                    continue;
                }
                player.getRace().setStatus(raceStatus);
                player.setStatus(playerStatus);
                var snapshot = snapshot(T);
                assertEquals(1.3, snapshot.getSpeed());
                assertEquals(0.0, snapshot.getGameplay().effectiveSpeed());
                assertEquals(0.0, snapshot.getMovementUnitsPerSecond());
                assertTrue(snapshot.getGameplay().activeEffects().isEmpty());
            }
        }
        verifyNoInteractions(repository);
    }

    @Test
    void minimumEffectiveSpeedIsSharedWithMovementSettlement() {
        when(repository.findRelevantForPlayers(List.of(1L), T, T))
                .thenReturn(List.of(effect(41, T, T + 3000, Integer.MAX_VALUE)));
        assertEquals(0.1, snapshot(T).getGameplay().effectiveSpeed());
        assertEquals(0.4, snapshot(T).getMovementUnitsPerSecond());
    }

    @Test
    void publicGameplayAndEffectsHaveExactlyLockedFieldsAndNoLeaks() throws Exception {
        when(repository.findRelevantForPlayers(List.of(1L), T, T))
                .thenReturn(List.of(effect(41, T, T + 3000, 1)));
        JsonNode json = new ObjectMapper().valueToTree(snapshot(T));
        assertEquals(StudentRaceSnapshotContractFixture.SNAPSHOT_FIELDS, names(json));
        JsonNode gameplay = json.get("gameplay");
        assertEquals(Set.of("mode", "effectiveSpeed", "activeEffects", "challenge"), names(gameplay));
        assertEquals("NORMAL", gameplay.get("mode").asText());
        JsonNode effect = gameplay.get("activeEffects").get(0);
        assertEquals(Set.of("effectId", "type", "source", "magnitudeTenths",
                "startsAtEpochMs", "endsAtEpochMs"), names(effect));
        assertEquals(41, effect.get("effectId").asLong());
        assertEquals("SPEED_SLOW", effect.get("type").asText());
        assertEquals("CHALLENGE_TIMEOUT", effect.get("source").asText());
        assertEquals(1, effect.get("magnitudeTenths").asInt());
        assertEquals(T, effect.get("startsAtEpochMs").asLong());
        assertEquals(T + 3000, effect.get("endsAtEpochMs").asLong());
    }

    @Test
    void modeVocabularyIsStableAndListsAreCopied() {
        assertEquals(Set.of("NORMAL", "CHALLENGE_CHOICE", "TURBO_TRIAL", "SAFE_RUN"),
                java.util.Arrays.stream(RacePlayerGameplayMode.values()).map(Enum::name)
                        .collect(java.util.stream.Collectors.toSet()));
        var mutable = new ArrayList<StudentRaceActiveEffectResponse>();
        var dto = new StudentRaceGameplayResponse(RacePlayerGameplayMode.NORMAL, 1.3, mutable, new com.quiz_wheelz.dto.raceplayer.StudentChallengeResponse(0, 100, null, null, null));
        mutable.add(new StudentRaceActiveEffectResponse(41L, EffectType.SPEED_SLOW,
                EffectSource.CHALLENGE_TIMEOUT, 1, T, T + 3000));
        assertTrue(dto.activeEffects().isEmpty());
        assertThrows(UnsupportedOperationException.class, () -> dto.activeEffects().add(mutable.getFirst()));
    }

    private Set<String> names(JsonNode json) {
        Set<String> names = new HashSet<>();
        json.fieldNames().forEachRemaining(names::add);
        return names;
    }

    private StudentRaceRuntimeSnapshotResponse snapshot(long instant) {
        return snapshots.fromRacePlayer(player, new StudentRaceStandingResult(1, 1, List.of()), instant, 12);
    }

    private RacePlayerSpeedEffect effect(long id, long start, long end, int magnitude) {
        RacePlayerSpeedEffect effect = new RacePlayerSpeedEffect();
        effect.setId(id);
        effect.setRacePlayer(player);
        effect.setType(EffectType.SPEED_SLOW);
        effect.setSource(EffectSource.CHALLENGE_TIMEOUT);
        effect.setMagnitudeTenths(magnitude);
        effect.setStartsAtEpochMs(start);
        effect.setEndsAtEpochMs(end);
        return effect;
    }

    private RacePlayer player() {
        Race race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);
        RacePlayer player = new RacePlayer();
        player.setId(1L);
        player.setRace(race);
        player.setSpeed(1.3);
        player.setStatus(RacePlayerStatus.RACING);
        return player;
    }
}
