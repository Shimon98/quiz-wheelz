package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceMovementServiceTest {

    private static final Instant ANCHOR_INSTANT = Instant.parse("2026-08-19T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long ANCHOR_EPOCH_MS = ANCHOR_INSTANT.toEpochMilli();
    private static final int TOTAL_DISTANCE = 1000;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    // Real RaceFinishService on purpose: finishPlayerIfNeeded touches only
    // the entity, so movement + finish are exercised together.
    private RaceMovementService service() {
        return new RaceMovementService(
                new RaceFinishService(
                        racePlayerRepository,
                        Clock.fixed(ANCHOR_INSTANT, FIXED_ZONE)
                ),
                playerQuestionRepository,
                Clock.fixed(ANCHOR_INSTANT, FIXED_ZONE)
        );
    }

    @Test
    void shouldMoveRacingPlayerByElapsedTimeAndSpeed() {
        RacePlayer player = racingPlayer(100.0, 0.5, ANCHOR_EPOCH_MS);

        boolean finished = service().settleTo(player, afterSeconds(10));

        // 10s x 0.5 x BASE 4.0 = 20 units.
        assertFalse(finished);
        assertEquals(120.0, player.getPosition(), 1e-9);
        assertEquals(afterSeconds(10), player.getMovementUpdatedAtEpochMs());
    }

    @Test
    void shouldMoveFasterPlayerFurtherInTheSameElapsedTime() {
        RacePlayer player = racingPlayer(100.0, 2.0, ANCHOR_EPOCH_MS);

        service().settleTo(player, afterSeconds(10));

        // 10s x 2.0 x BASE 4.0 = 80 units.
        assertEquals(180.0, player.getPosition(), 1e-9);
    }

    @Test
    void shouldIgnoreBackwardOrZeroElapsedTime() {
        RacePlayer player = racingPlayer(100.0, 1.0, ANCHOR_EPOCH_MS);

        assertFalse(service().settleTo(player, ANCHOR_EPOCH_MS));
        assertFalse(service().settleTo(player, ANCHOR_EPOCH_MS - 5_000));

        assertEquals(100.0, player.getPosition(), 1e-9);
        // The anchor never moves backward.
        assertEquals(ANCHOR_EPOCH_MS, player.getMovementUpdatedAtEpochMs());
    }

    @Test
    void shouldNotMoveNonRacingPlayers() {
        for (RacePlayerStatus status : new RacePlayerStatus[] {
                RacePlayerStatus.WAITING,
                RacePlayerStatus.FINISHED,
                RacePlayerStatus.DISCONNECTED,
        }) {
            RacePlayer player = racingPlayer(100.0, 1.0, ANCHOR_EPOCH_MS);
            player.setStatus(status);

            assertFalse(service().settleTo(player, afterSeconds(60)));
            assertEquals(100.0, player.getPosition(), 1e-9);
        }
    }

    @Test
    void shouldClampAtTotalDistanceAndFinishThePlayer() {
        RacePlayer player = racingPlayer(990.0, 0.5, ANCHOR_EPOCH_MS);
        PlayerQuestion leftoverActiveQuestion = new PlayerQuestion();
        leftoverActiveQuestion.setStatus(PlayerQuestionStatus.ACTIVE);

        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                player,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(leftoverActiveQuestion));

        // 60s at min speed = +120, far past the 10 remaining units.
        boolean finished = service().settleTo(player, afterSeconds(60));

        assertTrue(finished);
        assertEquals(1000.0, player.getPosition(), 1e-9);
        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
        assertEquals(0.0, player.getSpeed());
        // No owner ever touches a finished player's question again — the
        // leftover ACTIVE row is expired here.
        assertEquals(PlayerQuestionStatus.EXPIRED, leftoverActiveQuestion.getStatus());
        verify(playerQuestionRepository).save(leftoverActiveQuestion);
    }

    @Test
    void shouldBootstrapMissingAnchorFromStartedAt() {
        RacePlayer player = racingPlayer(0.0, 0.5, null);
        player.setStartedAt(
                LocalDateTime.ofInstant(ANCHOR_INSTANT, FIXED_ZONE)
        );

        service().settleTo(player, afterSeconds(10));

        // The legacy row still earns its 10 honest seconds of movement.
        assertEquals(20.0, player.getPosition(), 1e-9);
        assertEquals(afterSeconds(10), player.getMovementUpdatedAtEpochMs());
    }

    @Test
    void shouldAnchorAtTargetWhenNoTrustworthyStartExists() {
        RacePlayer player = racingPlayer(0.0, 0.5, null);

        boolean finished = service().settleTo(player, afterSeconds(10));

        // Never invent a historical elapsed interval.
        assertFalse(finished);
        assertEquals(0.0, player.getPosition(), 1e-9);
        assertEquals(afterSeconds(10), player.getMovementUpdatedAtEpochMs());
    }

    @Test
    void shouldThrowWhenTotalDistanceIsMissing() {
        RacePlayer player = racingPlayer(0.0, 0.5, ANCHOR_EPOCH_MS);
        player.getRace().setTotalDistance(null);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service().settleTo(player, afterSeconds(10))
        );

        assertEquals(ErrorCode.RACE_TOTAL_DISTANCE_MISSING, exception.getErrorCode());
    }

    @Test
    void shouldFinishMinimumSpeedPlayerInFiniteSimulatedTime() {
        RacePlayer player = racingPlayer(0.0, 0.5, ANCHOR_EPOCH_MS);
        RaceMovementService movementService = service();

        // A REGULAR 1000-unit race at the 0.5 floor = 2 units/sec → 500
        // simulated seconds. Sweep in 5s scheduler steps; the loop bound
        // proves finiteness, the Clock advances instead of real waiting.
        boolean finished = false;
        for (int sweep = 1; sweep <= 120 && !finished; sweep++) {
            finished = movementService.settleTo(player, afterSeconds(sweep * 5L));
        }

        assertTrue(finished);
        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
        assertEquals(1000.0, player.getPosition(), 1e-9);
        assertEquals(0.0, player.getSpeed());
    }

    private RacePlayer racingPlayer(
            double position,
            double speed,
            Long movementUpdatedAtEpochMs
    ) {
        Race race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(TOTAL_DISTANCE);

        RacePlayer player = new RacePlayer();
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(position);
        player.setSpeed(speed);
        player.setMovementUpdatedAtEpochMs(movementUpdatedAtEpochMs);

        return player;
    }

    private long afterSeconds(long seconds) {
        return ANCHOR_EPOCH_MS + seconds * 1000;
    }
}
