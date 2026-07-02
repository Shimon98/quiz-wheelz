package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceFinishServiceTest {

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Test
    void shouldFinishPlayerWhenPositionReachesTotalDistance() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        RacePlayer player = player(RacePlayerStatus.RACING, 120.0, 2.0, race(100));

        boolean finished = raceFinishService.finishPlayerIfNeeded(player);

        assertTrue(finished);
        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
        assertEquals(100.0, player.getPosition());
        assertEquals(0.0, player.getSpeed());
        assertNotNull(player.getFinishedAt());
    }

    @Test
    void shouldNotFinishPlayerBeforeTotalDistance() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        RacePlayer player = player(RacePlayerStatus.RACING, 99.0, 2.0, race(100));

        assertFalse(raceFinishService.finishPlayerIfNeeded(player));
        assertEquals(RacePlayerStatus.RACING, player.getStatus());
    }

    @Test
    void shouldThrowWhenFinishingPlayerAndRaceTotalDistanceIsMissing() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        RacePlayer player = player(RacePlayerStatus.RACING, 120.0, 2.0, race(null));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceFinishService.finishPlayerIfNeeded(player)
        );

        assertEquals(ErrorCode.RACE_TOTAL_DISTANCE_MISSING, exception.getErrorCode());
    }

    @Test
    void shouldNotRefinishAlreadyFinishedPlayer() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        RacePlayer player = player(RacePlayerStatus.FINISHED, 100.0, 0.0, race(100));
        LocalDateTime finishedAt = LocalDateTime.now().minusMinutes(1);
        player.setFinishedAt(finishedAt);

        assertFalse(raceFinishService.finishPlayerIfNeeded(player));
        assertSame(finishedAt, player.getFinishedAt());
    }

    @Test
    void shouldNotConvertDisconnectedPlayerToFinished() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        RacePlayer player = player(RacePlayerStatus.DISCONNECTED, 100.0, 0.0, race(100));

        assertFalse(raceFinishService.finishPlayerIfNeeded(player));
        assertEquals(RacePlayerStatus.DISCONNECTED, player.getStatus());
    }

    @Test
    void shouldFinishRaceWhenAllPlayersAreFinished() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race),
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race)
                ));

        assertTrue(raceFinishService.finishRaceIfNeeded(race));
        assertEquals(RaceStatus.FINISHED, race.getStatus());
        assertNotNull(race.getFinishedAt());
    }

    @Test
    void shouldFinishRaceWhenAllPlayersAreFinishedOrDisconnected() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race),
                        player(RacePlayerStatus.DISCONNECTED, 80.0, 0.0, race)
                ));

        assertTrue(raceFinishService.finishRaceIfNeeded(race));
        assertEquals(RaceStatus.FINISHED, race.getStatus());
    }

    @Test
    void shouldNotFinishRaceWhenPlayerIsStillRacing() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race),
                        player(RacePlayerStatus.RACING, 80.0, 1.0, race)
                ));

        assertFalse(raceFinishService.finishRaceIfNeeded(race));
        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
    }

    @Test
    void shouldNotFinishRaceWhenPlayerIsWaiting() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player(RacePlayerStatus.WAITING, 0.0, 0.0, race)));

        assertFalse(raceFinishService.finishRaceIfNeeded(race));
        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
    }

    @Test
    void shouldNotRefinishAlreadyFinishedRace() {
        RaceFinishService raceFinishService = new RaceFinishService(racePlayerRepository);
        Race race = race(100);
        race.setStatus(RaceStatus.FINISHED);
        LocalDateTime finishedAt = LocalDateTime.now().minusMinutes(1);
        race.setFinishedAt(finishedAt);

        assertFalse(raceFinishService.finishRaceIfNeeded(race));
        assertSame(finishedAt, race.getFinishedAt());
    }

    private Race race(Integer totalDistance) {
        Race race = new Race();
        race.setTotalDistance(totalDistance);
        race.setStatus(RaceStatus.IN_PROGRESS);

        return race;
    }

    private RacePlayer player(
            RacePlayerStatus status,
            Double position,
            Double speed,
            Race race
    ) {
        RacePlayer player = new RacePlayer();
        player.setRace(race);
        player.setStatus(status);
        player.setPosition(position);
        player.setSpeed(speed);

        return player;
    }
}
