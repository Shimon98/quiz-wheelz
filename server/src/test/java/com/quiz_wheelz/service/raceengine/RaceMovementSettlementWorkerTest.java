package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
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
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceMovementSettlementWorkerTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-08-19T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long RACE_ID = 4L;
    private static final long RACE_PLAYER_ID = 44L;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    @Mock
    private RaceFinishService raceFinishService;

    @Mock
    private RaceLiveEventChangeRecorder liveEventChangeRecorder;

    @Mock
    private RaceLiveMutationGate liveMutationGate;

    private RaceMovementSettlementWorker worker;

    @BeforeEach
    void setUp() {
        worker = new RaceMovementSettlementWorker(
                racePlayerRepository,
                raceRepository,
                gameplayPresenceService,
                gameplayTimelineService,
                raceFinishService,
                liveEventChangeRecorder,
                new RaceLiveMutationTracker(liveMutationGate, liveEventChangeRecorder),
                Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
        );
        lenient().when(liveMutationGate.lockIfActive(any())).thenAnswer(invocation -> {
            RacePlayer player = invocation.getArgument(0);
            return player.getStatus() == RacePlayerStatus.RACING
                    && player.getRace().getStatus() == RaceStatus.IN_PROGRESS
                    ? Optional.of(player.getRace())
                    : Optional.empty();
        });
        lenient().when(liveEventChangeRecorder.capturePlayer(any()))
                .thenAnswer(invocation -> playerState(invocation.getArgument(0)));
        lenient().when(liveEventChangeRecorder.captureRace(any()))
                .thenAnswer(invocation -> raceState(invocation.getArgument(0)));
    }

    @Test
    void shouldSettleLockedRacingPlayerWithOverdueTimeoutHandling() {
        RacePlayer racePlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));
        GameplayPresenceDecision presenceDecision = new GameplayPresenceDecision(
                true,
                true,
                false,
                FIXED_INSTANT.toEpochMilli()
        );
        when(gameplayPresenceService.resolve(racePlayer, FIXED_INSTANT))
                .thenReturn(presenceDecision);

        worker.settlePlayer(RACE_PLAYER_ID, RACE_ID);

        InOrder mutationOrder = inOrder(
                racePlayerRepository,
                liveMutationGate,
                gameplayPresenceService
        );
        mutationOrder.verify(racePlayerRepository)
                .findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        mutationOrder.verify(liveMutationGate).lockIfActive(racePlayer);
        mutationOrder.verify(gameplayPresenceService).resolve(
                racePlayer,
                FIXED_INSTANT
        );

        verify(gameplayTimelineService).settleBackground(
                racePlayer,
                FIXED_INSTANT,
                presenceDecision
        );
        verify(liveEventChangeRecorder).recordPlayerChange(any(), any());
        verify(gameplayPresenceService, never()).recordGameplayActivity(any(), any());
    }

    @Test
    void shouldSkipPlayerThatLeftRacingBeforeTheLockWasAcquired() {
        RacePlayer finishedPlayer = createPlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(finishedPlayer));

        worker.settlePlayer(RACE_PLAYER_ID, RACE_ID);

        verify(gameplayTimelineService, never())
                .settleBackground(any(), any(), any());
    }

    @Test
    void shouldSkipPlayerWhoseRaceIsNoLongerInProgress() {
        RacePlayer racePlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        worker.settlePlayer(RACE_PLAYER_ID, RACE_ID);

        verify(gameplayTimelineService, never())
                .settleBackground(any(), any(), any());
    }

    @Test
    void shouldSkipMissingPlayer() {
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.empty());

        worker.settlePlayer(RACE_PLAYER_ID, RACE_ID);

        verify(gameplayTimelineService, never())
                .settleBackground(any(), any(), any());
    }

    @Test
    void finalizationShouldLockPlayersByIdBeforeLockingRace() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        RacePlayer finishedPlayer = createPlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );
        when(racePlayerRepository.findAllLockedByRaceIdOrderById(RACE_ID))
                .thenReturn(List.of(finishedPlayer));
        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.of(race));

        worker.finalizeRaceIfComplete(RACE_ID);

        InOrder lockOrder = inOrder(racePlayerRepository, raceRepository);
        lockOrder.verify(racePlayerRepository)
                .findAllLockedByRaceIdOrderById(RACE_ID);
        lockOrder.verify(raceRepository).findLockedById(RACE_ID);
        verify(raceFinishService).finishRaceIfAllPlayersTerminal(
                race,
                List.of(finishedPlayer)
        );
    }

    @Test
    void finalizationShouldSkipRaceLockWhenNoPlayersExist() {
        when(racePlayerRepository.findAllLockedByRaceIdOrderById(RACE_ID))
                .thenReturn(List.of());

        worker.finalizeRaceIfComplete(RACE_ID);

        verify(raceRepository, never()).findLockedById(RACE_ID);
        verify(raceFinishService, never())
                .finishRaceIfAllPlayersTerminal(any(), any());
    }

    @Test
    void finalizationShouldSkipMissingRaceAfterPlayerLocks() {
        RacePlayer finishedPlayer = createPlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );
        when(racePlayerRepository.findAllLockedByRaceIdOrderById(RACE_ID))
                .thenReturn(List.of(finishedPlayer));
        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.empty());

        worker.finalizeRaceIfComplete(RACE_ID);

        verify(raceFinishService, never())
                .finishRaceIfAllPlayersTerminal(any(), any());
    }

    @Test
    void reconnectWinnerShouldRemainRacingAndBlockFinalization() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        RacePlayer activePlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        GameplayPresenceDecision online = new GameplayPresenceDecision(
                true,
                true,
                false,
                FIXED_INSTANT.toEpochMilli()
        );
        stubFinalizationLocks(race, List.of(activePlayer));
        when(gameplayPresenceService.resolve(activePlayer, FIXED_INSTANT))
                .thenReturn(online);

        worker.finalizeRaceIfComplete(RACE_ID);

        assertEquals(RacePlayerStatus.RACING, activePlayer.getStatus());
        assertEquals(RaceStatus.IN_PROGRESS, race.getStatus());
        verify(gameplayTimelineService, never())
                .settleForRaceFinalization(any(), any(), any());
        verify(racePlayerRepository, never()).saveAllAndFlush(any());
        verify(raceFinishService, never())
                .finishRaceIfAllPlayersTerminal(any(), any());
    }

    @Test
    void activeClassmateShouldPreserveAbsentPlayersReconnectWindow() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        RacePlayer absentPlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        RacePlayer activePlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        activePlayer.setId(RACE_PLAYER_ID + 1);
        GameplayPresenceDecision absent = absentDecision();
        GameplayPresenceDecision online = new GameplayPresenceDecision(
                true,
                true,
                false,
                FIXED_INSTANT.toEpochMilli()
        );
        stubFinalizationLocks(race, List.of(absentPlayer, activePlayer));
        when(gameplayPresenceService.resolve(absentPlayer, FIXED_INSTANT))
                .thenReturn(absent);
        when(gameplayPresenceService.resolve(activePlayer, FIXED_INSTANT))
                .thenReturn(online);

        worker.finalizeRaceIfComplete(RACE_ID);

        assertEquals(RacePlayerStatus.RACING, absentPlayer.getStatus());
        verify(gameplayTimelineService, never())
                .settleForRaceFinalization(any(), any(), any());
        verify(raceFinishService, never())
                .finishRaceIfAllPlayersTerminal(any(), any());
    }

    @Test
    void finalizationWinnerShouldNormalizeAbsentPlayerBeforeRaceFinish() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        RacePlayer absentPlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        GameplayPresenceDecision absent = absentDecision();
        stubFinalizationLocks(race, List.of(absentPlayer));
        when(gameplayPresenceService.resolve(absentPlayer, FIXED_INSTANT))
                .thenReturn(absent);
        doAnswer(invocation -> {
            absentPlayer.setStatus(RacePlayerStatus.DISCONNECTED);
            return true;
        }).when(gameplayTimelineService).settleForRaceFinalization(
                absentPlayer,
                FIXED_INSTANT,
                absent
        );
        doAnswer(invocation -> {
            race.setStatus(RaceStatus.FINISHED);
            return true;
        }).when(raceFinishService).finishRaceIfAllPlayersTerminal(
                race,
                List.of(absentPlayer)
        );

        worker.finalizeRaceIfComplete(RACE_ID);

        assertEquals(RacePlayerStatus.DISCONNECTED, absentPlayer.getStatus());
        assertEquals(RaceStatus.FINISHED, race.getStatus());
        InOrder persistenceOrder = inOrder(racePlayerRepository, raceFinishService);
        persistenceOrder.verify(racePlayerRepository)
                .saveAllAndFlush(List.of(absentPlayer));
        persistenceOrder.verify(raceFinishService)
                .finishRaceIfAllPlayersTerminal(race, List.of(absentPlayer));
        verify(gameplayPresenceService).markOffline(absentPlayer);
    }

    @Test
    void legitimateFinishDuringCutoffSettlementShouldBePreserved() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        RacePlayer absentPlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        GameplayPresenceDecision absent = absentDecision();
        stubFinalizationLocks(race, List.of(absentPlayer));
        when(gameplayPresenceService.resolve(absentPlayer, FIXED_INSTANT))
                .thenReturn(absent);
        doAnswer(invocation -> {
            absentPlayer.setStatus(RacePlayerStatus.FINISHED);
            return false;
        }).when(gameplayTimelineService).settleForRaceFinalization(
                absentPlayer,
                FIXED_INSTANT,
                absent
        );

        worker.finalizeRaceIfComplete(RACE_ID);

        assertEquals(RacePlayerStatus.FINISHED, absentPlayer.getStatus());
        verify(gameplayPresenceService, never()).markOffline(absentPlayer);
        verify(racePlayerRepository).saveAllAndFlush(List.of(absentPlayer));
        verify(raceFinishService).finishRaceIfAllPlayersTerminal(
                race,
                List.of(absentPlayer)
        );
    }

    @Test
    void finalizationShouldNormalizeEveryAbsentRacingPlayer() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        RacePlayer firstAbsent = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        RacePlayer secondAbsent = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        secondAbsent.setId(RACE_PLAYER_ID + 1);
        GameplayPresenceDecision absent = absentDecision();
        List<RacePlayer> players = List.of(firstAbsent, secondAbsent);
        stubFinalizationLocks(race, players);
        when(gameplayPresenceService.resolve(firstAbsent, FIXED_INSTANT))
                .thenReturn(absent);
        when(gameplayPresenceService.resolve(secondAbsent, FIXED_INSTANT))
                .thenReturn(absent);
        doAnswer(invocation -> {
            invocation.getArgument(0, RacePlayer.class)
                    .setStatus(RacePlayerStatus.DISCONNECTED);
            return true;
        }).when(gameplayTimelineService)
                .settleForRaceFinalization(any(), any(), any());

        worker.finalizeRaceIfComplete(RACE_ID);

        assertEquals(RacePlayerStatus.DISCONNECTED, firstAbsent.getStatus());
        assertEquals(RacePlayerStatus.DISCONNECTED, secondAbsent.getStatus());
        verify(racePlayerRepository).saveAllAndFlush(players);
        verify(liveEventChangeRecorder).recordFinalizationPlayerChanges(
                any(),
                any()
        );
        verify(raceFinishService).finishRaceIfAllPlayersTerminal(race, players);
    }

    @Test
    void waitingPlayerShouldAlwaysBlockFinalization() {
        Race race = createRace(RaceStatus.IN_PROGRESS);
        RacePlayer waitingPlayer = createPlayer(
                RacePlayerStatus.WAITING,
                RaceStatus.IN_PROGRESS
        );
        stubFinalizationLocks(race, List.of(waitingPlayer));

        worker.finalizeRaceIfComplete(RACE_ID);

        verify(gameplayPresenceService, never()).resolve(any(), any());
        verify(raceFinishService, never())
                .finishRaceIfAllPlayersTerminal(any(), any());
    }

    private void stubFinalizationLocks(Race race, List<RacePlayer> players) {
        when(racePlayerRepository.findAllLockedByRaceIdOrderById(RACE_ID))
                .thenReturn(players);
        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.of(race));
    }

    private GameplayPresenceDecision absentDecision() {
        return new GameplayPresenceDecision(
                true,
                false,
                false,
                FIXED_INSTANT.minusSeconds(60).toEpochMilli()
        );
    }

    private Race createRace(RaceStatus raceStatus) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);
        race.setTotalDistance(1000);
        return race;
    }

    private PlayerLiveState playerState(RacePlayer racePlayer) {
        return new PlayerLiveState(
                racePlayer.getPosition(),
                racePlayer.getSpeed(),
                racePlayer.getScore(),
                racePlayer.getStreak(),
                racePlayer.getStatus(),
                racePlayer.getFinishedAt()
        );
    }

    private RaceLiveState raceState(Race race) {
        return new RaceLiveState(race.getStatus(), race.getFinishedAt());
    }

    private RacePlayer createPlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = createRace(raceStatus);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);

        return racePlayer;
    }
}
