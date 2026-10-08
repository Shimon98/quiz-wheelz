package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.*;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class StudentRaceOpponentEffectProjectionTest {

    private static final long T = 10000;
    private final Race race = race();
    private final RacePlayer current = player(1, 38, 1.3, T);
    private final RacePlayer opponent = player(2, 0, 1.3, 0);
    private final RacePlayer other = player(3, 10, 0.5, 1000);
    private final RacePlayerSpeedEffectRepository effects = mock(RacePlayerSpeedEffectRepository.class);
    private final RacePlayerRepository players = mock(RacePlayerRepository.class);
    private final PlayerQuestionRepository questions = mock(PlayerQuestionRepository.class);
    private final RacePlayerGameplayPresenceService presence = mock(RacePlayerGameplayPresenceService.class);
    private final RaceSpeedEffectMovementCalculator calculator =
            new RaceSpeedEffectMovementCalculator(new RaceMovementCalculator());
    private final StudentRaceStandingProjectionService projectionService = new StudentRaceStandingProjectionService(
            presence, new RacePlayerGameplayTimelineService(mock(QuestionTimeoutService.class),
            mock(RaceMovementService.class), org.mockito.Mockito.mock(com.quiz_wheelz.service.challenge.RacePlayerChallengeTimelineService.class), org.mockito.Mockito.mock(com.quiz_wheelz.service.challenge.ChallengeOfferService.class)), questions, calculator, new RacePlayerSpeedEffectService(effects),
            Clock.fixed(Instant.ofEpochMilli(T), ZoneOffset.UTC));

    @Test
    void oneBatchSeparatesPlayerEffectsAndChangesRankUsingSettlementMath() {
        online(opponent);
        online(other);
        var slowdown = effect(opponent, 2000, 7000, 10);
        when(effects.findRelevantForPlayers(List.of(2L, 3L), 0, T)).thenReturn(List.of(slowdown));
        when(players.findByRaceOrderByLaneNumberAsc(race)).thenReturn(List.of(current, opponent, other));
        var result = new StudentRaceStandingService(players, new RaceStandingCalculator(ZoneOffset.UTC),
                projectionService).calculate(current, T);
        assertEquals(1, result.rank());
        assertEquals(32.0, result.opponents().getFirst().position());
        assertEquals(28.0, result.opponents().get(1).position());
        assertEquals(1.3, result.opponents().getFirst().effectiveSpeed());
        var expected = calculator.project(0, 1.3, 0, T, 1000, List.of(slowdown));
        assertEquals(expected.position(), result.opponents().getFirst().position());
        assertEquals(0.0, opponent.getPosition());
        assertEquals(0L, opponent.getMovementUpdatedAtEpochMs());
        assertEquals(1.3, opponent.getSpeed());
        verify(effects, times(1)).findRelevantForPlayers(List.of(2L, 3L), 0, T);
        verifyNoMoreInteractions(effects);
    }

    @Test
    void currentRateUsesHalfOpenEffectiveSpeedAndNoOpponentVisualPayload() {
        online(opponent);
        when(effects.findRelevantForPlayers(List.of(2L), 0, T))
                .thenReturn(List.of(effect(opponent, T, T + 1000, 1)));
        when(players.findByRaceOrderByLaneNumberAsc(race)).thenReturn(List.of(current, opponent));
        var result = new StudentRaceStandingService(players, new RaceStandingCalculator(ZoneOffset.UTC),
                projectionService).calculate(current, T);
        assertEquals(52.0, result.opponents().getFirst().position());
        assertEquals(1.2, result.opponents().getFirst().effectiveSpeed());
        var snapshot = StudentRaceRuntimeSnapshotTestFixture.service().fromRacePlayer(current, result, T, 1);
        assertEquals(4.8, snapshot.getOpponents().getFirst().getMovementUnitsPerSecond());
        when(effects.findRelevantForPlayers(List.of(2L), 0, T))
                .thenReturn(List.of(effect(opponent, 0, T, 1)));
        assertEquals(1.3, projectionService.projectAt(List.of(current, opponent), 1L, T)
                .get(2L).effectiveSpeed());
    }

    @Test
    void absenceAndQuestionExpiryStillCapSlowdownProjectionAndRate() {
        when(presence.resolve(opponent, Instant.ofEpochMilli(T)))
                .thenReturn(new GameplayPresenceDecision(true, false, false, 6000L));
        PlayerQuestion question = new PlayerQuestion();
        question.setRacePlayer(opponent);
        question.setExpiresAt(java.time.LocalDateTime.ofInstant(Instant.ofEpochMilli(5000), ZoneOffset.UTC));
        when(questions.findByRacePlayerInAndStatus(List.of(opponent), PlayerQuestionStatus.ACTIVE))
                .thenReturn(List.of(question));
        when(effects.findRelevantForPlayers(List.of(2L), 0, T))
                .thenReturn(List.of(effect(opponent, 1000, T + 1000, 1)));
        var projected = projectionService.projectAt(List.of(current, opponent), 1L, T).get(2L);
        assertEquals(24.4, projected.position());
        assertEquals(5000L, projected.effectiveAtEpochMs());
        assertEquals(0.0, projected.effectiveSpeed());
        assertEquals(0.0, opponent.getPosition());
    }

    @Test
    void crossingInsideSlowdownKeepsExactFinishInstantAndZeroRate() {
        opponent.setPosition(998.0);
        opponent.setSpeed(1.0);
        online(opponent);
        when(effects.findRelevantForPlayers(List.of(2L), 0, T))
                .thenReturn(List.of(effect(opponent, 0, T + 1000, 2)));
        var projected = projectionService.projectAt(List.of(current, opponent), 1L, T).get(2L);
        assertTrue(projected.crossedFinish());
        assertEquals(625L, projected.finishCrossingEpochMs());
        assertEquals(0.0, projected.effectiveSpeed());
        assertEquals(RacePlayerStatus.RACING, opponent.getStatus());
    }

    @Test
    void settledArbitrationRosterKeepsStoredPositionsAndUsesEffectiveOrStaleRates() {
        opponent.setMovementUpdatedAtEpochMs(T);
        when(effects.findRelevantForPlayers(List.of(2L, 3L), T, T))
                .thenReturn(List.of(effect(opponent, T, T + 1000, 1)));
        var result = new StudentRaceStandingService(players, new RaceStandingCalculator(ZoneOffset.UTC),
                projectionService).calculateSettledAt(current, List.of(current, opponent, other), T);
        var byId = result.opponents().stream().collect(java.util.stream.Collectors.toMap(
                StudentRaceStandingResult.Opponent::racePlayerId, item -> item));
        assertEquals(0.0, byId.get(2L).position());
        assertEquals(1.2, byId.get(2L).effectiveSpeed());
        assertEquals(10.0, byId.get(3L).position());
        assertEquals(0.0, byId.get(3L).effectiveSpeed());
        verifyNoInteractions(players, presence, questions);
        verify(effects).findRelevantForPlayers(List.of(2L, 3L), T, T);
    }

    private void online(RacePlayer player) {
        when(presence.resolve(player, Instant.ofEpochMilli(T)))
                .thenReturn(new GameplayPresenceDecision(true, true, false, T));
    }

    private RacePlayerSpeedEffect effect(RacePlayer player, long start, long end, int magnitude) {
        RacePlayerSpeedEffect effect = new RacePlayerSpeedEffect();
        effect.setRacePlayer(player);
        effect.setId(player.getId());
        effect.setType(EffectType.SPEED_SLOW);
        effect.setSource(EffectSource.CHALLENGE_TIMEOUT);
        effect.setMagnitudeTenths(magnitude);
        effect.setStartsAtEpochMs(start);
        effect.setEndsAtEpochMs(end);
        return effect;
    }

    private Race race() {
        Race race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);
        return race;
    }

    private RacePlayer player(long id, double position, double speed, long anchor) {
        RacePlayer player = new RacePlayer();
        player.setId(id);
        player.setRace(race);
        player.setDisplayName("Player " + id);
        player.setLaneNumber((int) id);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(position);
        player.setSpeed(speed);
        player.setMovementUpdatedAtEpochMs(anchor);
        return player;
    }
}
