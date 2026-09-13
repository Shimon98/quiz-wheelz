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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceFinishServiceTest {

    private static final Instant CLOCK_INSTANT = Instant.parse("2026-09-10T12:00:00Z");
    private static final ZoneId ZONE = ZoneId.of("Asia/Jerusalem");
    private static final long FINISH_EPOCH_MS = Instant.parse("2026-09-10T11:59:58.123Z").toEpochMilli();

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private RaceFinishService service() {
        return new RaceFinishService(racePlayerRepository, Clock.fixed(CLOCK_INSTANT, ZONE));
    }

    @Test
    void shouldFinishPlayerAtTheGivenInstantNotTheClock() {
        RacePlayer player = player(RacePlayerStatus.RACING, 120.0, 2.0, race(100));

        boolean finished = service().finishPlayerAt(player, FINISH_EPOCH_MS);

        assertTrue(finished);
        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
        assertEquals(100.0, player.getPosition());
        assertEquals(0.0, player.getSpeed());
        assertEquals(FINISH_EPOCH_MS, player.getFinishedAtEpochMs());
        assertEquals(
                LocalDateTime.ofInstant(Instant.ofEpochMilli(FINISH_EPOCH_MS), ZONE),
                player.getFinishedAt()
        );
    }

    @Test
    void shouldNotFinishPlayerBeforeTotalDistance() {
        RacePlayer player = player(RacePlayerStatus.RACING, 99.0, 2.0, race(100));

        assertFalse(service().finishPlayerAt(player, FINISH_EPOCH_MS));
        assertEquals(RacePlayerStatus.RACING, player.getStatus());
        assertNull(player.getFinishedAtEpochMs());
        assertNull(player.getFinishedAt());
    }

    @Test
    void shouldThrowWhenFinishingPlayerAndRaceTotalDistanceIsMissing() {
        RacePlayer player = player(RacePlayerStatus.RACING, 120.0, 2.0, race(null));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service().finishPlayerAt(player, FINISH_EPOCH_MS)
        );

        assertEquals(ErrorCode.RACE_TOTAL_DISTANCE_MISSING, exception.getErrorCode());
    }

    @Test
    void duplicateFinishShouldNotAlterTheCanonicalTimestamp() {
        RacePlayer player = player(RacePlayerStatus.RACING, 100.0, 0.0, race(100));
        assertTrue(service().finishPlayerAt(player, FINISH_EPOCH_MS));
        LocalDateTime finishedAt = player.getFinishedAt();

        assertFalse(service().finishPlayerAt(player, FINISH_EPOCH_MS + 5_000));

        assertEquals(FINISH_EPOCH_MS, player.getFinishedAtEpochMs());
        assertSame(finishedAt, player.getFinishedAt());
    }

    @Test
    void shouldNotConvertDisconnectedPlayerToFinished() {
        RacePlayer player = player(RacePlayerStatus.DISCONNECTED, 100.0, 0.0, race(100));

        assertFalse(service().finishPlayerAt(player, FINISH_EPOCH_MS));
        assertEquals(RacePlayerStatus.DISCONNECTED, player.getStatus());
    }

    @Test
    void shouldFinishRaceWhenAllPlayersAreFinished() {
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race),
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race)
                ));

        assertTrue(service().finishRaceIfNeeded(race));
        assertEquals(RaceStatus.FINISHED, race.getStatus());
        assertNotNull(race.getFinishedAt());
    }

    @Test
    void shouldFinishRaceWhenAllPlayersAreFinishedOrDisconnected() {
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race),
                        player(RacePlayerStatus.DISCONNECTED, 80.0, 0.0, race)
                ));

        assertTrue(service().finishRaceIfNeeded(race));
        assertEquals(RaceStatus.FINISHED, race.getStatus());
    }

    @Test
    void shouldNotFinishRaceWhenPlayerIsStillRacing() {
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(
                        player(RacePlayerStatus.FINISHED, 100.0, 0.0, race),
                        player(RacePlayerStatus.RACING, 80.0, 1.0, race)
                ));

        assertFalse(service().finishRaceIfNeeded(race));
        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
    }

    @Test
    void lockedFinalizationShouldRejectAnyActiveStatusPlayer() {
        Race race = race(100);
        RacePlayer finished = player(RacePlayerStatus.FINISHED, 100.0, 0.0, race);
        RacePlayer absent = player(RacePlayerStatus.RACING, 80.0, 1.0, race);

        assertFalse(service().finishRaceIfAllPlayersTerminal(race, List.of(finished, absent)));
        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
    }

    @Test
    void shouldNotFinishRaceWhenPlayerIsWaiting() {
        Race race = race(100);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(player(RacePlayerStatus.WAITING, 0.0, 0.0, race)));

        assertFalse(service().finishRaceIfNeeded(race));
        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
    }

    @Test
    void shouldNotRefinishAlreadyFinishedRace() {
        Race race = race(100);
        race.setStatus(RaceStatus.FINISHED);
        LocalDateTime finishedAt = LocalDateTime.now().minusMinutes(1);
        race.setFinishedAt(finishedAt);

        assertFalse(service().finishRaceIfNeeded(race));
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
