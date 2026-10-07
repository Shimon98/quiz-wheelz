package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RaceSpeedEffectMovementTest {

    private final RaceMovementCalculator normal = new RaceMovementCalculator();
    private final RaceSpeedEffectMovementCalculator calculator = new RaceSpeedEffectMovementCalculator(normal);

    @Test
    void noEffectsPreserveExactNormalProjection() {
        assertEquals(normal.project(12.3456, 1.3, 0, 4321, 1000),
                calculator.project(12.3456, 1.3, 0, 4321, 1000, List.of()));
    }

    @Test
    void internalWindowUsesThreeSegments() {
        assertEquals(36.0, project(0, 10000, effect(2000, 7000, 2)).position());
    }

    @Test
    void windowActiveAtAnchorUsesOnlyRemainingDuration() {
        assertEquals(17.6, project(3000, 8000, effect(2000, 6000, 2)).position());
    }

    @Test
    void windowBeyondTargetStopsAtTarget() {
        assertEquals(18.4, project(0, 5000, effect(3000, 9000, 2)).position());
    }

    @Test
    void halfOpenExpiredAndFutureWindowsHaveNoImpact() {
        assertEquals(20.0, calculator.project(0, 1, 5000, 10000, 1000,
                List.of(effect(0, 5000, 2), effect(10000, 15000, 2))).position());
    }

    @Test
    void minimumTenthsSpeedCannotStopOrReverse() {
        assertEquals(0.4, calculator.project(0, 0.5, 0, 1000, 1000,
                List.of(effect(0, 2000, Integer.MAX_VALUE))).position());
    }

    @Test
    void finishInsideSlowdownPreservesExactCrossing() {
        var projection = calculator.project(998, 1, 0, 5000, 1000,
                List.of(effect(0, 2000, 2)));
        assertEquals(625L, projection.finishCrossingEpochMs());
        assertEquals(625L, projection.effectiveAtEpochMs());
    }

    @Test
    void finishAfterSlowdownPreservesExactCrossing() {
        var projection = calculator.project(990, 1, 0, 5000, 1000,
                List.of(effect(0, 1000, 2)));
        assertEquals(2700L, projection.finishCrossingEpochMs());
    }

    @Test
    void finishBeforeEffectStopsLaterSegments() {
        assertEquals(500L, calculator.project(998, 1, 0, 5000, 1000,
                List.of(effect(1000, 2000, 2))).finishCrossingEpochMs());
    }

    @Test
    void partitionedSettlementMatchesOneShotAcrossBoundariesAndFinish() {
        List<RacePlayerSpeedEffect> windows = List.of(effect(123, 4321, 3), effect(5000, 6000, 2));
        var whole = calculator.project(950.1234, 1.3, 0, 20000, 1000, windows);
        double position = 950.1234;
        long cursor = 0;
        RaceMovementCalculator.Projection split = null;
        for (long target = 37; target <= 20017; target += 37) {
            split = calculator.project(position, 1.3, cursor, Math.min(target, 20000), 1000, windows);
            if (split.crossedFinish()) {
                break;
            }
            position = split.position();
            cursor = split.effectiveAtEpochMs();
        }
        assertEquals(whole, split);
    }

    @Test
    void unrelatedLegacyBoostIsNotActivated() {
        RacePlayerSpeedEffect boost = effect(0, 10000, 2);
        boost.setType(EffectType.SPEED_BOOST);
        assertEquals(40.0, project(0, 10000, boost).position());
    }

    @Test
    void settlementLeavesEarnedBaseSpeedIntact() {
        RacePlayer player = player(0);
        RacePlayerSpeedEffectService effects = mock(RacePlayerSpeedEffectService.class);
        when(effects.findOverlapping(player, 0, 10000))
                .thenReturn(List.of(effect(2000, 7000, 2)));
        service(effects, mock(PlayerQuestionRepository.class)).settleTo(player, 10000);
        assertEquals(36.0, player.getPosition());
        assertEquals(1.0, player.getSpeed());
        assertEquals(10000L, player.getMovementUpdatedAtEpochMs());
    }

    @Test
    void movementFinishStillExpiresLeftoverActiveQuestion() {
        RacePlayer player = player(998);
        RacePlayerSpeedEffectService effects = mock(RacePlayerSpeedEffectService.class);
        when(effects.findOverlapping(player, 0, 5000))
                .thenReturn(List.of(effect(0, 2000, 2)));
        PlayerQuestionRepository questions = mock(PlayerQuestionRepository.class);
        PlayerQuestion question = new PlayerQuestion();
        when(questions.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(player, PlayerQuestionStatus.ACTIVE))
                .thenReturn(Optional.of(question));
        assertTrue(service(effects, questions).settleTo(player, 5000));
        assertEquals(625L, player.getFinishedAtEpochMs());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        verify(questions).save(question);
    }

    private RaceMovementService service(RacePlayerSpeedEffectService effects, PlayerQuestionRepository questions) {
        return new RaceMovementService(calculator, effects,
                new RaceFinishService(mock(RacePlayerRepository.class), Clock.systemUTC()),
                questions, Clock.systemUTC());
    }

    private RacePlayer player(double position) {
        Race race = new Race();
        race.setTotalDistance(1000);
        RacePlayer player = new RacePlayer();
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setSpeed(1.0);
        player.setPosition(position);
        player.setMovementUpdatedAtEpochMs(0L);
        return player;
    }

    private RaceMovementCalculator.Projection project(long anchor, long target, RacePlayerSpeedEffect effect) {
        return calculator.project(0, 1, anchor, target, 1000, List.of(effect));
    }

    private RacePlayerSpeedEffect effect(long start, long end, int magnitude) {
        RacePlayerSpeedEffect effect = new RacePlayerSpeedEffect();
        effect.setType(EffectType.SPEED_SLOW);
        effect.setStartsAtEpochMs(start);
        effect.setEndsAtEpochMs(end);
        effect.setMagnitudeTenths(magnitude);
        return effect;
    }
}
