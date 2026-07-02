package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RaceProgressServiceTest {

    private final RaceProgressService raceProgressService = new RaceProgressService();

    @Test
    void shouldCalculateCorrectAnswerProgressByDifficulty() {
        assertEquals(10.0,
                raceProgressService.calculateProgressDelta(Difficulty.EASY, true));
        assertEquals(15.0,
                raceProgressService.calculateProgressDelta(Difficulty.MEDIUM, true));
        assertEquals(20.0,
                raceProgressService.calculateProgressDelta(Difficulty.HARD, true));
    }

    @Test
    void shouldGiveNoProgressForWrongAnswer() {
        assertEquals(0.0,
                raceProgressService.calculateProgressDelta(Difficulty.HARD, false));
    }

    @Test
    void shouldCalculateCorrectAnswerSpeedByDifficulty() {
        RacePlayer player = racePlayer(0.0, 0.0, 100);

        assertEquals(1.0,
                raceProgressService.calculateNewSpeed(player, Difficulty.EASY, true));
        assertEquals(1.5,
                raceProgressService.calculateNewSpeed(player, Difficulty.MEDIUM, true));
        assertEquals(2.0,
                raceProgressService.calculateNewSpeed(player, Difficulty.HARD, true));
    }

    @Test
    void shouldReduceWrongAnswerSpeedWithoutGoingBelowMinimum() {
        RacePlayer player = racePlayer(0.0, 1.5, 100);

        assertEquals(1.0,
                raceProgressService.calculateNewSpeed(player, Difficulty.EASY, false));

        player.setSpeed(0.2);

        assertEquals(0.5,
                raceProgressService.calculateNewSpeed(player, Difficulty.EASY, false));
    }

    @Test
    void shouldTreatNullSpeedAsZeroWhenApplyingWrongAnswerPenalty() {
        RacePlayer player = racePlayer(0.0, null, 100);

        assertEquals(0.5,
                raceProgressService.calculateNewSpeed(player, Difficulty.EASY, false));
    }

    @Test
    void shouldIncreasePositionAndCapAtRaceDistance() {
        RacePlayer player = racePlayer(90.0, 0.0, 100);

        assertEquals(100.0, raceProgressService.calculateNewPosition(player, 20.0));
    }

    @Test
    void shouldTreatNullPositionAsZero() {
        RacePlayer player = racePlayer(null, 0.0, 100);

        assertEquals(15.0, raceProgressService.calculateNewPosition(player, 15.0));
    }

    @Test
    void shouldThrowWhenRaceTotalDistanceIsMissing() {
        RacePlayer player = racePlayer(10.0, 1.0, null);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceProgressService.calculateNewPosition(player, 10.0)
        );

        assertEquals(ErrorCode.RACE_TOTAL_DISTANCE_MISSING, exception.getErrorCode());
    }

    private RacePlayer racePlayer(
            Double position,
            Double speed,
            Integer totalDistance
    ) {
        Race race = new Race();
        race.setTotalDistance(totalDistance);

        RacePlayer player = new RacePlayer();
        player.setRace(race);
        player.setPosition(position);
        player.setSpeed(speed);
        player.setStatus(RacePlayerStatus.RACING);

        return player;
    }
}
