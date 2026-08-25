package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceMovementSettlementFinalizationEventTest {

    private static final Instant NOW = Instant.parse("2026-08-25T09:00:00Z");
    private static final long RACE_ID = 31L;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RacePlayerGameplayPresenceService presenceService;

    @Mock
    private RacePlayerGameplayTimelineService timelineService;

    @Mock
    private RaceFinishService finishService;

    @Mock
    private RaceLiveEventRecorder eventRecorder;

    @Mock
    private RaceLiveMutationTracker mutationTracker;

    private RaceMovementSettlementWorker worker;

    @BeforeEach
    void setUp() {
        worker = new RaceMovementSettlementWorker(
                racePlayerRepository,
                raceRepository,
                presenceService,
                timelineService,
                finishService,
                new RaceLiveEventChangeRecorder(eventRecorder),
                mutationTracker,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void multipleNonTerminalChangesEmitOneProgressEventAfterAllPlayersAreSettled() {
        Race race = race();
        RacePlayer first = player(41L, race);
        RacePlayer second = player(42L, race);
        List<RacePlayer> players = List.of(first, second);
        prepareFinalization(race, players);
        doAnswer(invocation -> {
            invocation.getArgument(0, RacePlayer.class)
                    .setStatus(RacePlayerStatus.DISCONNECTED);
            return true;
        }).when(timelineService).settleForRaceFinalization(any(), any(), any());
        doAnswer(invocation -> {
            assertEquals(RacePlayerStatus.DISCONNECTED, first.getStatus());
            assertEquals(RacePlayerStatus.DISCONNECTED, second.getStatus());
            return null;
        }).when(eventRecorder).recordPlayerProgressUpdated(race);

        worker.finalizeRaceIfComplete(RACE_ID);

        verify(eventRecorder).recordPlayerProgressUpdated(race);
        verify(eventRecorder, never()).recordPlayerFinished(any());
        verify(eventRecorder, never()).recordRaceFinished(any());
        verify(racePlayerRepository).saveAllAndFlush(players);
    }

    @Test
    void mixedTerminalBatchEmitsFinishedBeforeProgressForReversedPlayerOrder() {
        Race race = race();
        RacePlayer disconnected = player(41L, race);
        RacePlayer finished = player(42L, race);
        List<RacePlayer> players = List.of(disconnected, finished);
        prepareFinalization(race, players);
        when(timelineService.settleForRaceFinalization(any(), any(), any()))
                .thenAnswer(invocation -> {
                    RacePlayer racePlayer = invocation.getArgument(0);
                    if (racePlayer == finished) {
                        racePlayer.setStatus(RacePlayerStatus.FINISHED);
                        racePlayer.setFinishedAt(LocalDateTime.of(2026, 8, 25, 9, 0));
                        return false;
                    }
                    racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
                    return true;
                });
        when(finishService.finishRaceIfAllPlayersTerminal(race, players))
                .thenAnswer(invocation -> {
                    race.setStatus(RaceStatus.FINISHED);
                    race.setFinishedAt(LocalDateTime.of(2026, 8, 25, 9, 1));
                    return true;
                });

        worker.finalizeRaceIfComplete(RACE_ID);

        InOrder eventOrder = inOrder(eventRecorder);
        eventOrder.verify(eventRecorder).recordPlayerFinished(finished);
        eventOrder.verify(eventRecorder).recordPlayerProgressUpdated(race);
        eventOrder.verify(eventRecorder).recordRaceFinished(race);
        verifyNoMoreInteractions(eventRecorder);
    }

    private void prepareFinalization(Race race, List<RacePlayer> players) {
        GameplayPresenceDecision absent = new GameplayPresenceDecision(
                true,
                false,
                false,
                NOW.minusSeconds(60).toEpochMilli()
        );
        when(racePlayerRepository.findAllLockedByRaceIdOrderById(RACE_ID))
                .thenReturn(players);
        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.of(race));
        for (RacePlayer player : players) {
            when(presenceService.resolve(player, NOW)).thenReturn(absent);
        }
    }

    private Race race() {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);
        return race;
    }

    private RacePlayer player(Long id, Race race) {
        RacePlayer player = new RacePlayer();
        player.setId(id);
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(100.0);
        player.setSpeed(1.0);
        player.setScore(20);
        player.setStreak(2);
        return player;
    }
}
