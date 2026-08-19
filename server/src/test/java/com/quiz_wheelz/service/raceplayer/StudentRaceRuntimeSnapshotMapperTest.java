package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentRaceRuntimeSnapshotMapperTest {

    private static final long SNAPSHOT_AT_EPOCH_MS = 1_780_000_000_000L;

    private final StudentRaceRuntimeSnapshotMapper mapper =
            new StudentRaceRuntimeSnapshotMapper();

    @Test
    void fromRacePlayerShouldMapActiveRaceAndPlayerState() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        StudentRaceRuntimeSnapshotResponse snapshot =
                mapper.fromRacePlayer(racePlayer, SNAPSHOT_AT_EPOCH_MS);

        assertEquals(1000, snapshot.getTotalDistance());
        assertEquals(50, snapshot.getScore());
        assertEquals(120.0, snapshot.getPosition());
        assertEquals(1.2, snapshot.getSpeed());
        assertEquals(3, snapshot.getStreak());
        assertEquals(5, snapshot.getHighestStreak());
        assertEquals(Difficulty.EASY, snapshot.getCurrentDifficulty());
        assertEquals(RacePlayerStatus.RACING, snapshot.getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, snapshot.getRaceStatus());
        assertFalse(snapshot.isPlayerFinished());
        assertFalse(snapshot.isRaceFinished());
        assertEquals(SNAPSHOT_AT_EPOCH_MS, snapshot.getSnapshotAtEpochMs());
        // speed 1.2 x BASE_MOVEMENT_UNITS_PER_SECOND 4.0
        assertEquals(4.8, snapshot.getMovementUnitsPerSecond());
    }

    @Test
    void fromRacePlayerShouldMarkPlayerFinishedWhenPlayerStatusIsFinished() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );

        StudentRaceRuntimeSnapshotResponse snapshot =
                mapper.fromRacePlayer(racePlayer, SNAPSHOT_AT_EPOCH_MS);

        assertTrue(snapshot.isPlayerFinished());
        assertFalse(snapshot.isRaceFinished());
    }

    @Test
    void fromRacePlayerShouldMarkRaceFinishedWhenRaceStatusIsFinished() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );

        StudentRaceRuntimeSnapshotResponse snapshot =
                mapper.fromRacePlayer(racePlayer, SNAPSHOT_AT_EPOCH_MS);

        assertFalse(snapshot.isPlayerFinished());
        assertTrue(snapshot.isRaceFinished());
    }

    @Test
    void fromAnswerRaceImpactShouldMapPostAnswerSnapshot() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        AnswerRaceImpact impact = new AnswerRaceImpact(
                1L,
                7L,
                true,
                10,
                10.0,
                60,
                130.0,
                1.0,
                4,
                5,
                4,
                0,
                Difficulty.EASY,
                Difficulty.MEDIUM,
                0,
                0,
                true,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS,
                false,
                false
        );

        StudentRaceRuntimeSnapshotResponse snapshot =
                mapper.fromAnswerRaceImpact(impact, race, SNAPSHOT_AT_EPOCH_MS);

        assertEquals(1000, snapshot.getTotalDistance());
        assertEquals(60, snapshot.getScore());
        assertEquals(130.0, snapshot.getPosition());
        assertEquals(1.0, snapshot.getSpeed());
        assertEquals(4, snapshot.getStreak());
        assertEquals(5, snapshot.getHighestStreak());
        assertEquals(Difficulty.MEDIUM, snapshot.getCurrentDifficulty());
        assertEquals(RacePlayerStatus.RACING, snapshot.getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, snapshot.getRaceStatus());
        assertFalse(snapshot.isPlayerFinished());
        assertFalse(snapshot.isRaceFinished());
        assertEquals(SNAPSHOT_AT_EPOCH_MS, snapshot.getSnapshotAtEpochMs());
        // speed 1.0 x BASE_MOVEMENT_UNITS_PER_SECOND 4.0
        assertEquals(4.0, snapshot.getMovementUnitsPerSecond());
    }

    private RacePlayer createRacePlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(createRace(raceStatus));
        racePlayer.setStatus(playerStatus);
        racePlayer.setScore(50);
        racePlayer.setPosition(120.0);
        racePlayer.setSpeed(1.2);
        racePlayer.setStreak(3);
        racePlayer.setHighestStreak(5);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);

        return racePlayer;
    }

    private Race createRace(RaceStatus raceStatus) {
        Race race = new Race();
        race.setTotalDistance(1000);
        race.setStatus(raceStatus);

        return race;
    }
}
