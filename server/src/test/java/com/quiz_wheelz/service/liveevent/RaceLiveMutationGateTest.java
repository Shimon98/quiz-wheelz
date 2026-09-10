package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RaceRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RaceLiveMutationGateTest {

    private static final long RACE_ID = 7L;

    private final RaceRepository raceRepository = mock(RaceRepository.class);
    private final RaceLiveMutationGate gate = new RaceLiveMutationGate(raceRepository);

    @Test
    void racingPlayerLocksRaceAndReturnsActiveRace() {
        Race race = race(RaceStatus.IN_PROGRESS);
        RacePlayer racePlayer = racePlayer(race, RacePlayerStatus.RACING);
        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.of(race));

        assertEquals(Optional.of(race), gate.lockIfActive(racePlayer));
        verify(raceRepository).findLockedById(RACE_ID);
    }

    @Test
    void waitingPlayerNeverLocksRace() {
        Race race = race(RaceStatus.READY);
        RacePlayer racePlayer = racePlayer(race, RacePlayerStatus.WAITING);

        assertTrue(gate.lockIfActive(racePlayer).isEmpty());
        verify(raceRepository, never()).findLockedById(RACE_ID);
    }

    @Test
    void nonInProgressRaceDoesNotOpenLiveMutationBoundary() {
        Race race = race(RaceStatus.FINISHED);
        RacePlayer racePlayer = racePlayer(race, RacePlayerStatus.RACING);
        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.of(race));

        assertTrue(gate.lockIfActive(racePlayer).isEmpty());
    }

    private Race race(RaceStatus status) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(status);
        return race;
    }

    private RacePlayer racePlayer(Race race, RacePlayerStatus status) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setStatus(status);
        return racePlayer;
    }
}
