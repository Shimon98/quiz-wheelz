package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.raceplayer.RacePlayerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceStartLiveEventTest {

    private static final Instant NOW = Instant.parse("2026-08-24T17:00:00Z");

    @Mock
    private TeacherRaceAccessService raceAccessService;

    @Mock
    private RacePlayerService racePlayerService;

    @Mock
    private RaceLiveEventRecorder eventRecorder;

    private TeacherRaceStartService service;
    @BeforeEach
    void setUp() {
        service = new TeacherRaceStartService(
                raceAccessService,
                racePlayerService,
                eventRecorder,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void successfulStartRecordsExactlyOneEventAfterAuthoritativeMutation() {
        Race race = race(RaceStatus.WAITING_FOR_PLAYERS);
        when(raceAccessService.requireOwnedRaceForUpdate(12L)).thenReturn(race);
        when(racePlayerService.countPlayersByRaceAndStatus(any(), any())).thenReturn(2L);
        when(racePlayerService.startWaitingPlayers(race, LocalDateTime.ofInstant(NOW, ZoneOffset.UTC)))
                .thenReturn(2);

        service.startRace(12L);

        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
        assertEquals(LocalDateTime.ofInstant(NOW, ZoneOffset.UTC), race.getStartedAt());
        verify(eventRecorder).recordRaceStarted(race);
    }

    @Test
    void rejectedStartRecordsNoEvent() {
        Race race = race(RaceStatus.IN_PROGRESS);
        when(raceAccessService.requireOwnedRaceForUpdate(12L)).thenReturn(race);

        assertThrows(ApiException.class, () -> service.startRace(12L));

        verify(eventRecorder, never()).recordRaceStarted(any());
    }

    private Race race(RaceStatus status) {
        Race race = new Race();
        race.setId(12L);
        race.setStatus(status);
        return race;
    }
}
