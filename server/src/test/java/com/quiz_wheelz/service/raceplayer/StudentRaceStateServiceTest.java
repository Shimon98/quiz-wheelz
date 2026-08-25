package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InOrder;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRaceStateServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 9L;
    private static final String RACE_TITLE = "Easy multiplication";
    private static final String ROOM_CODE = "ABC123";

    @Mock
    private RacePlayerSessionLockService sessionLockService;

    @Mock
    private RaceLiveMutationGate liveMutationGate;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RacePlayerGameplayRequestGuard gameplayRequestGuard;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    @Mock
    private RaceFinishService raceFinishService;

    @Mock
    private HttpServletRequest request;

    @Test
    void getRaceStateShouldLockSettleAndReturnRaceMetadataAndSnapshot() {
        RacePlayer racePlayer = mockResolvedAndLocked(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(RACE_TITLE, response.getRaceTitle());
        assertEquals(ROOM_CODE, response.getRoomCode());
        assertSame(racePlayer.getRace().getStartedAt(), response.getStartedAt());
        assertSame(racePlayer.getRace().getFinishedAt(), response.getFinishedAt());
        assertEquals(RACE_PLAYER_ID, response.getPlayer().getRacePlayerId());
        assertEquals("Noa", response.getPlayer().getDisplayName());
        assertEquals(3, response.getPlayer().getLaneNumber());
        assertEquals("HOVER_KART", response.getPlayer().getVehicleTypeKey());
        assertEquals("GREEN", response.getPlayer().getVehicleColorKey());
        assertEquals("HOVER_KART_GREEN", response.getPlayer().getVehicleAssetKey());
        assertEquals(RacePlayerStatus.RACING, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, response.getSnapshot().getRaceStatus());
        assertFalse(response.getSnapshot().isPlayerFinished());
        assertFalse(response.getSnapshot().isRaceFinished());
        assertEquals(
                FIXED_INSTANT.toEpochMilli(),
                response.getSnapshot().getSnapshotAtEpochMs()
        );
        assertEquals(4.8, response.getSnapshot().getMovementUnitsPerSecond());
        assertEquals(1, response.getSnapshot().getRank());
        assertEquals(1, response.getSnapshot().getPlayerCount());
        assertTrue(response.getSnapshot().getNearbyPlayers().isEmpty());

        InOrder mutationOrder = inOrder(
                sessionLockService,
                liveMutationGate,
                racePlayerRepository
        );
        mutationOrder.verify(sessionLockService).lock(
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID)
        );
        mutationOrder.verify(liveMutationGate).lockIfActive(racePlayer);
        mutationOrder.verify(racePlayerRepository)
                .findByRaceOrderByLaneNumberAsc(racePlayer.getRace());

        verify(sessionLockService).lock(new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID));
        verify(racePlayerRepository).findByRaceOrderByLaneNumberAsc(racePlayer.getRace());
        verify(gameplayRequestGuard).requireGameplayAccess(racePlayer, FIXED_INSTANT);
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    @Test
    void getRaceStateShouldSupportWaitingPlayerAndWaitingRace() {
        mockResolvedAndLocked(
                RacePlayerStatus.WAITING,
                RaceStatus.WAITING_FOR_PLAYERS
        );

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RacePlayerStatus.WAITING, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.WAITING_FOR_PLAYERS, response.getSnapshot().getRaceStatus());
        assertFalse(response.getSnapshot().isPlayerFinished());
        assertFalse(response.getSnapshot().isRaceFinished());
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    @Test
    void getRaceStateShouldSupportFinishedPlayerAndFinishedRace() {
        mockResolvedAndLocked(
                RacePlayerStatus.FINISHED,
                RaceStatus.FINISHED
        );

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RacePlayerStatus.FINISHED, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.FINISHED, response.getSnapshot().getRaceStatus());
        assertTrue(response.getSnapshot().isPlayerFinished());
        assertTrue(response.getSnapshot().isRaceFinished());
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    @Test
    void getRaceStateShouldCheckRaceFinishWhenSettlementFinishesThePlayer() {
        RacePlayer racePlayer = mockResolvedAndLocked(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        RacePlayer laterFinisher = createOtherRacePlayer(
                racePlayer.getRace(),
                10L,
                999.0,
                RacePlayerStatus.FINISHED
        );
        laterFinisher.setFinishedAt(LocalDateTime.of(2026, 6, 30, 10, 0, 2));
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(racePlayer.getRace()))
                .thenReturn(List.of(laterFinisher, racePlayer));

        doAnswer(invocation -> {
            racePlayer.setPosition(1000.0);
            racePlayer.setStatus(RacePlayerStatus.FINISHED);
            racePlayer.setFinishedAt(LocalDateTime.of(2026, 6, 30, 10, 0, 1));
            return null;
        }).when(gameplayRequestGuard).requireGameplayAccess(any(), any());

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertTrue(response.getSnapshot().isPlayerFinished());
        assertEquals(1, response.getSnapshot().getRank());
        assertEquals(2, response.getSnapshot().getPlayerCount());
        assertEquals(
                RacePlayerStatus.FINISHED,
                response.getSnapshot().getNearbyPlayers().get(0).getStatus()
        );
        verify(raceFinishService).finishRaceIfNeeded(racePlayer.getRace());
    }

    @Test
    void getRaceStateShouldCalculateStandingAfterCurrentPlayerSettlement() {
        RacePlayer racePlayer = mockResolvedAndLocked(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        RacePlayer opponent = createOtherRacePlayer(
                racePlayer.getRace(),
                10L,
                600.0,
                RacePlayerStatus.RACING
        );
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(racePlayer.getRace()))
                .thenReturn(List.of(opponent, racePlayer));
        doAnswer(invocation -> {
            racePlayer.setPosition(700.0);
            return null;
        }).when(gameplayRequestGuard).requireGameplayAccess(racePlayer, FIXED_INSTANT);

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(700.0, response.getSnapshot().getPosition());
        assertEquals(1, response.getSnapshot().getRank());
        assertEquals(600.0, response.getSnapshot().getNearbyPlayers().get(0).getPosition());
    }

    @Test
    void getRaceStateShouldRejectPlayerThatCannotBeLocked() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(sessionLockService.resolveIdentity(request)).thenReturn(identity);
        when(sessionLockService.lock(identity))
                .thenThrow(new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().getRaceState(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void activePlayerRaceStateShouldRequireReconnectWithoutPresence() {
        RacePlayer racePlayer = mockResolvedAndLocked(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        false,
                        false,
                        FIXED_INSTANT.minusSeconds(1).toEpochMilli()
                );
        when(gameplayPresenceService.resolve(racePlayer, FIXED_INSTANT))
                .thenReturn(presenceDecision);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService(createRealGameplayRequestGuard()).getRaceState(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, exception.getErrorCode());
        verify(gameplayTimelineService).settleGameplayRequest(
                racePlayer,
                FIXED_INSTANT,
                presenceDecision
        );
        verify(gameplayPresenceService, never()).recordGameplayActivity(
                racePlayer,
                FIXED_INSTANT
        );
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    @Test
    void finishedPlayerRaceStateShouldRemainReadableWithoutPresence() {
        mockResolvedAndLocked(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );

        StudentRaceStateResponse response = createService(
                createRealGameplayRequestGuard()
        ).getRaceState(request);

        assertEquals(RacePlayerStatus.FINISHED, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, response.getSnapshot().getRaceStatus());
        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
    }

    @Test
    void disconnectedPlayerRaceStateShouldRemainReadableWithoutPresence() {
        mockResolvedAndLocked(
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );

        StudentRaceStateResponse response = createService(
                createRealGameplayRequestGuard()
        ).getRaceState(request);

        assertEquals(
                RacePlayerStatus.DISCONNECTED,
                response.getSnapshot().getPlayerStatus()
        );
        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
    }

    @Test
    void terminalRaceStateShouldRemainReadableWithoutPresence() {
        mockResolvedAndLocked(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );

        StudentRaceStateResponse response = createService(
                createRealGameplayRequestGuard()
        ).getRaceState(request);

        assertEquals(RacePlayerStatus.RACING, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.FINISHED, response.getSnapshot().getRaceStatus());
        assertTrue(response.getSnapshot().isRaceFinished());
        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
    }

    private StudentRaceStateService createService() {
        return createService(gameplayRequestGuard);
    }

    private StudentRaceStateService createService(
            RacePlayerGameplayRequestGuard requestGuard
    ) {
        return new StudentRaceStateService(
                sessionLockService,
                requestGuard,
                raceFinishService,
                new StudentRaceStandingService(
                        racePlayerRepository,
                        new RaceStandingCalculator()
                ),
                new StudentRaceRuntimeSnapshotMapper(),
                mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class),
                liveMutationGate,
                Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
        );
    }

    private RacePlayerGameplayRequestGuard createRealGameplayRequestGuard() {
        return new RacePlayerGameplayRequestGuard(
                gameplayPresenceService,
                gameplayTimelineService,
                racePlayerRepository
        );
    }

    private RacePlayer mockResolvedAndLocked(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        RacePlayer racePlayer = createRacePlayer(playerStatus, raceStatus);

        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(sessionLockService.resolveIdentity(request)).thenReturn(identity);
        when(sessionLockService.lock(identity)).thenReturn(racePlayer);
        lenient().when(liveMutationGate.lockIfActive(racePlayer)).thenReturn(
                playerStatus == RacePlayerStatus.RACING
                        && raceStatus == RaceStatus.IN_PROGRESS
                        ? Optional.of(racePlayer.getRace())
                        : Optional.empty()
        );
        lenient().when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(racePlayer.getRace()))
                .thenReturn(List.of(racePlayer));

        return racePlayer;
    }

    private RacePlayer createRacePlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setTitle(RACE_TITLE);
        race.setRoomCode(ROOM_CODE);
        race.setStatus(raceStatus);
        race.setTotalDistance(1000);
        race.setStartedAt(LocalDateTime.of(2026, 7, 5, 10, 0));
        race.setFinishedAt(
                raceStatus == RaceStatus.FINISHED
                        ? LocalDateTime.of(2026, 7, 5, 10, 5)
                        : null
        );

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setDisplayName("Noa");
        racePlayer.setLaneNumber(3);
        racePlayer.setVehicleTypeKey("HOVER_KART");
        racePlayer.setVehicleColorKey("GREEN");
        racePlayer.setStatus(playerStatus);
        racePlayer.setScore(50);
        racePlayer.setPosition(120.0);
        racePlayer.setSpeed(1.2);
        racePlayer.setStreak(3);
        racePlayer.setHighestStreak(5);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);

        return racePlayer;
    }

    private RacePlayer createOtherRacePlayer(
            Race race,
            Long id,
            Double position,
            RacePlayerStatus status
    ) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(id);
        racePlayer.setRace(race);
        racePlayer.setDisplayName("Player " + id);
        racePlayer.setLaneNumber(4);
        racePlayer.setVehicleTypeKey("HOVER_KART");
        racePlayer.setVehicleColorKey("BLUE");
        racePlayer.setStatus(status);
        racePlayer.setPosition(position);
        racePlayer.setSpeed(1.0);
        return racePlayer;
    }
}
