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
    void shouldAddCorrectAnswerSpeedBoostByDifficulty() {
        RacePlayer player = racePlayer(0.0, 0.5, 100);

        assertEquals(0.7,
                raceProgressService.calculateNewSpeed(player, Difficulty.EASY, true),
                1e-9);
        assertEquals(0.8,
                raceProgressService.calculateNewSpeed(player, Difficulty.MEDIUM, true),
                1e-9);
        assertEquals(0.9,
                raceProgressService.calculateNewSpeed(player, Difficulty.HARD, true),
                1e-9);
    }

    @Test
    void shouldAccumulateRepeatedCorrectBoostsUpToMaxSpeed() {
        RacePlayer player = racePlayer(0.0, 0.5, 100);

        // Repeated success keeps accelerating (0.5 → 0.7 → 0.9 → ...) and
        // caps at MAX_RACING_SPEED — never beyond.
        for (int answer = 0; answer < 10; answer++) {
            player.setSpeed(
                    raceProgressService.calculateNewSpeed(player, Difficulty.EASY, true)
            );
        }

        assertEquals(2.0, player.getSpeed());
        assertEquals(2.0,
                raceProgressService.calculateNewSpeed(player, Difficulty.HARD, true));
    }

    @Test
    void shouldReduceWrongAnswerSpeedWithoutGoingBelowMinimum() {
        RacePlayer player = racePlayer(0.0, 1.5, 100);

        assertEquals(1.3,
                raceProgressService.calculateNewSpeed(player, Difficulty.EASY, false),
                1e-9);

        player.setSpeed(0.6);

        assertEquals(0.5,
                raceProgressService.calculateNewSpeed(player, Difficulty.EASY, false));
    }

    @Test
    void shouldReduceTimeoutSpeedMoreThanWrongAnswerWithoutGoingBelowMinimum() {
        RacePlayer player = racePlayer(0.0, 1.5, 100);

        // Timeout (no answer) is a stronger failure than a wrong attempt.
        assertEquals(1.1, raceProgressService.calculateTimeoutSpeed(player), 1e-9);

        player.setSpeed(0.6);

        assertEquals(0.5, raceProgressService.calculateTimeoutSpeed(player));
    }

    @Test
    void shouldReturnFinishedSpeedForTimeoutOnFinishedPlayer() {
        RacePlayer player = racePlayer(100.0, 1.5, 100);
        player.setStatus(RacePlayerStatus.FINISHED);

        assertEquals(0.0, raceProgressService.calculateTimeoutSpeed(player));
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
