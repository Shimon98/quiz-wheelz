package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InOrder;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerLifecycleLiveEventTest {

    private static final Instant NOW = Instant.parse("2026-08-24T18:00:00Z");

    @Mock
    private RacePlayerSessionLockService sessionLockService;

    @Mock
    private RacePlayerGameplayPresenceService presenceService;

    @Mock
    private RacePlayerGameplayTimelineService timelineService;

    @Mock
    private RacePlayerDisconnectService disconnectService;

    @Mock
    private RaceLiveEventRecorder eventRecorder;

    @Mock
    private RaceLiveMutationGate liveMutationGate;

    @Mock
    private HttpServletRequest request;

    private RaceLiveEventChangeRecorder changeRecorder;

    @BeforeEach
    void setUp() {
        changeRecorder = new RaceLiveEventChangeRecorder(eventRecorder);
        when(liveMutationGate.lockIfActive(any())).thenAnswer(invocation -> {
            RacePlayer player = invocation.getArgument(0);
            return player.getStatus() == RacePlayerStatus.RACING
                    ? Optional.of(player.getRace())
                    : Optional.empty();
        });
    }

    @Test
    void duplicateDisconnectBoundaryEmitsOneProgressEvent() {
        RacePlayer player = racingPlayer();
        when(sessionLockService.resolveAndLock(request)).thenReturn(player);
        doAnswer(invocation -> {
            player.setStatus(RacePlayerStatus.DISCONNECTED);
            return true;
        }).when(disconnectService).disconnectForPlayerActivity(any(), any());
        RacePlayerLeaveService service = new RacePlayerLeaveService(
                sessionLockService,
                disconnectService,
                changeRecorder,
                liveMutationGate,
                fixedClock()
        );

        service.leave(request);
        service.leave(request);

        InOrder mutationOrder = inOrder(
                sessionLockService,
                liveMutationGate,
                disconnectService
        );
        mutationOrder.verify(sessionLockService).resolveAndLock(request);
        mutationOrder.verify(liveMutationGate).lockIfActive(player);
        mutationOrder.verify(disconnectService)
                .disconnectForPlayerActivity(any(), any());
        verify(eventRecorder).recordPlayerProgressUpdated(player.getRace());
    }

    @Test
    void reconnectMeaningfulMovementEmitsOnceAndImmediateNoOpDoesNotRepeat() {
        RacePlayer player = racingPlayer();
        when(sessionLockService.resolveAndLock(request)).thenReturn(player);
        when(presenceService.resolve(player, NOW)).thenReturn(
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        true,
                        false,
                        NOW.toEpochMilli()
                )
        );
        doAnswer(invocation -> {
            if (player.getPosition() == 0.0) {
                player.setPosition(8.0);
            }
            return null;
        }).when(timelineService).settleReconnect(any(), any(), any());
        RacePlayerReconnectService service = new RacePlayerReconnectService(
                sessionLockService,
                presenceService,
                timelineService,
                disconnectService,
                changeRecorder,
                liveMutationGate,
                fixedClock()
        );

        service.reconnect(request);
        service.reconnect(request);

        InOrder mutationOrder = inOrder(
                sessionLockService,
                liveMutationGate,
                presenceService
        );
        mutationOrder.verify(sessionLockService).resolveAndLock(request);
        mutationOrder.verify(liveMutationGate).lockIfActive(player);
        mutationOrder.verify(presenceService).resolve(player, NOW);
        verify(eventRecorder, times(1)).recordPlayerProgressUpdated(player.getRace());
    }

    private RacePlayer racingPlayer() {
        Race race = new Race();
        race.setId(10L);
        race.setStatus(RaceStatus.IN_PROGRESS);
        RacePlayer player = new RacePlayer();
        player.setId(20L);
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(0.0);
        player.setSpeed(4.0);
        player.setScore(0);
        player.setStreak(0);
        return player;
    }

    private Clock fixedClock() {
        return Clock.fixed(NOW, ZoneOffset.UTC);
    }
}
