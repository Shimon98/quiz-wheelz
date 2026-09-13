package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceOpponentResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentRaceRuntimeSnapshotMapperTest {

    private static final long SNAPSHOT_AT_EPOCH_MS = 1_780_000_000_000L;
    private static final long POSITION_AT_EPOCH_MS = 1_779_999_999_500L;
    private static final long OPPONENT_POSITION_AT_EPOCH_MS = 1_779_999_999_100L;
    private static final long FINISHED_AT_EPOCH_MS = 1_779_999_998_000L;
    private static final long EVENT_VERSION = 42L;

    private final StudentRaceRuntimeSnapshotMapper mapper =
            new StudentRaceRuntimeSnapshotMapper();

    @Test
    void fromRacePlayerShouldMapActiveRaceAndPlayerState() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        StudentRaceRuntimeSnapshotResponse snapshot =
                mapper.fromRacePlayer(racePlayer, standing(), SNAPSHOT_AT_EPOCH_MS, EVENT_VERSION);

        assertEquals(1000, snapshot.getTotalDistance());
        assertEquals(50, snapshot.getScore());
        assertEquals(120.0, snapshot.getPosition());
        assertEquals(POSITION_AT_EPOCH_MS, snapshot.getPositionAtEpochMs());
        assertEquals(1.2, snapshot.getSpeed());
        assertEquals(3, snapshot.getStreak());
        assertEquals(5, snapshot.getHighestStreak());
        assertEquals(Difficulty.EASY, snapshot.getCurrentDifficulty());
        assertEquals(RacePlayerStatus.RACING, snapshot.getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, snapshot.getRaceStatus());
        assertFalse(snapshot.isPlayerFinished());
        assertFalse(snapshot.isRaceFinished());
        assertNull(snapshot.getPlayerFinishedAtEpochMs());
        assertEquals(SNAPSHOT_AT_EPOCH_MS, snapshot.getSnapshotAtEpochMs());
        assertEquals(4.8, snapshot.getMovementUnitsPerSecond());
        assertEquals(EVENT_VERSION, snapshot.getEventVersion());
        assertEquals(2, snapshot.getRank());
        assertEquals(5, snapshot.getPlayerCount());
        assertEquals(1, snapshot.getOpponents().size());

        StudentRaceOpponentResponse opponent = snapshot.getOpponents().get(0);
        assertEquals(91L, opponent.getRacePlayerId());
        assertEquals("Noa", opponent.getDisplayName());
        assertEquals(3, opponent.getLaneNumber());
        assertEquals("TOY_CAR", opponent.getVehicleTypeKey());
        assertEquals("BLUE", opponent.getVehicleColorKey());
        assertEquals("TOY_CAR_BLUE", opponent.getVehicleAssetKey());
        assertEquals(1, opponent.getRank());
        assertEquals(420.0, opponent.getPosition());
        assertEquals(OPPONENT_POSITION_AT_EPOCH_MS, opponent.getPositionAtEpochMs());
        assertEquals(5.2, opponent.getMovementUnitsPerSecond(), 1e-9);
        assertEquals(RacePlayerStatus.RACING, opponent.getStatus());
        assertNull(opponent.getFinishedAtEpochMs());
    }

    @Test
    void fromRacePlayerShouldExposeCanonicalFinishAndZeroRateForFinishedPlayer() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );
        racePlayer.setFinishedAtEpochMs(FINISHED_AT_EPOCH_MS);
        racePlayer.setSpeed(0.0);

        StudentRaceRuntimeSnapshotResponse snapshot =
                mapper.fromRacePlayer(racePlayer, standing(), SNAPSHOT_AT_EPOCH_MS, EVENT_VERSION);

        assertTrue(snapshot.isPlayerFinished());
        assertFalse(snapshot.isRaceFinished());
        assertEquals(FINISHED_AT_EPOCH_MS, snapshot.getPlayerFinishedAtEpochMs());
        assertEquals(0.0, snapshot.getMovementUnitsPerSecond());
    }

    @Test
    void terminalOpponentsAndFinishedRacesExposeZeroMovementRate() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );
        StudentRaceStandingResult standing = new StudentRaceStandingResult(
                2,
                3,
                List.of(
                        opponent(91L, RacePlayerStatus.FINISHED, FINISHED_AT_EPOCH_MS),
                        opponent(92L, RacePlayerStatus.DISCONNECTED, null)
                )
        );

        StudentRaceRuntimeSnapshotResponse snapshot =
                mapper.fromRacePlayer(racePlayer, standing, SNAPSHOT_AT_EPOCH_MS, EVENT_VERSION);

        assertTrue(snapshot.isRaceFinished());
        assertEquals(0.0, snapshot.getMovementUnitsPerSecond());
        assertEquals(0.0, snapshot.getOpponents().get(0).getMovementUnitsPerSecond());
        assertEquals(FINISHED_AT_EPOCH_MS, snapshot.getOpponents().get(0).getFinishedAtEpochMs());
        assertEquals(0.0, snapshot.getOpponents().get(1).getMovementUnitsPerSecond());
    }

    @Test
    void fromAnswerRaceImpactShouldMapPostAnswerSnapshot() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
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
                mapper.fromAnswerRaceImpact(
                        impact,
                        racePlayer,
                        standing(),
                        SNAPSHOT_AT_EPOCH_MS,
                        EVENT_VERSION
                );

        assertEquals(1000, snapshot.getTotalDistance());
        assertEquals(60, snapshot.getScore());
        assertEquals(130.0, snapshot.getPosition());
        assertEquals(POSITION_AT_EPOCH_MS, snapshot.getPositionAtEpochMs());
        assertEquals(1.0, snapshot.getSpeed());
        assertEquals(4, snapshot.getStreak());
        assertEquals(5, snapshot.getHighestStreak());
        assertEquals(Difficulty.MEDIUM, snapshot.getCurrentDifficulty());
        assertEquals(RacePlayerStatus.RACING, snapshot.getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, snapshot.getRaceStatus());
        assertFalse(snapshot.isPlayerFinished());
        assertFalse(snapshot.isRaceFinished());
        assertEquals(SNAPSHOT_AT_EPOCH_MS, snapshot.getSnapshotAtEpochMs());
        assertEquals(4.0, snapshot.getMovementUnitsPerSecond());
        assertEquals(EVENT_VERSION, snapshot.getEventVersion());
        assertEquals(2, snapshot.getRank());
        assertEquals(5, snapshot.getPlayerCount());
        assertEquals(91L, snapshot.getOpponents().get(0).getRacePlayerId());
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
        racePlayer.setMovementUpdatedAtEpochMs(POSITION_AT_EPOCH_MS);
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

    private StudentRaceStandingResult standing() {
        return new StudentRaceStandingResult(
                2,
                5,
                List.of(opponent(91L, RacePlayerStatus.RACING, null))
        );
    }

    private StudentRaceStandingResult.Opponent opponent(
            Long racePlayerId,
            RacePlayerStatus status,
            Long finishedAtEpochMs
    ) {
        return new StudentRaceStandingResult.Opponent(
                racePlayerId,
                "Noa",
                3,
                "TOY_CAR",
                "BLUE",
                "TOY_CAR_BLUE",
                1,
                420.0,
                OPPONENT_POSITION_AT_EPOCH_MS,
                1.3,
                status,
                finishedAtEpochMs
        );
    }
}
