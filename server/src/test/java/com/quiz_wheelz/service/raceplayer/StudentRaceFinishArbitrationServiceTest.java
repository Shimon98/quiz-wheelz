package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishArbitrationResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.ANCHOR;
import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.EVENT_VERSION;
import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.NOW;
import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.RACE_ID;
import static com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationTestFixture.T;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class StudentRaceFinishArbitrationServiceTest {

    private StudentRaceFinishArbitrationTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentRaceFinishArbitrationTestFixture();
    }

    @Test
    void waitingRaceIsRejectedBeforeAnyRosterLock() {
        RacePlayer requester = fixture.waiting(1L);
        fixture.race.setStatus(RaceStatus.WAITING_FOR_PLAYERS);
        fixture.requester(requester);

        ApiException exception = assertThrows(ApiException.class, fixture::arbitrate);

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
        verify(fixture.racePlayerRepository, never()).findAllLockedByRaceIdOrderById(any());
        verify(fixture.raceRepository, never()).findLockedById(any());
        verifyNoInteractions(fixture.presenceService, fixture.liveEventRecorder);
    }

    @Test
    void identityIsResolvedWithoutLockingTheRequesterFirst() {
        RacePlayer requester = fixture.racing(1L, 500.0, 1.0, ANCHOR);
        fixture.requester(requester);
        fixture.online(requester);

        fixture.arbitrate();

        InOrder order = inOrder(fixture.sessionLockService, fixture.racePlayerRepository, fixture.raceRepository);
        order.verify(fixture.sessionLockService).resolveIdentity(fixture.request);
        order.verify(fixture.racePlayerRepository).existsByIdAndRaceId(1L, RACE_ID);
        order.verify(fixture.raceRepository).findStatusById(RACE_ID);
        order.verify(fixture.racePlayerRepository).findAllLockedByRaceIdOrderById(RACE_ID);
        order.verify(fixture.raceRepository).findLockedById(RACE_ID);
        verify(fixture.racePlayerRepository, never()).findLockedByIdAndRaceId(any(), any());
        verify(fixture.sessionLockService, never()).lock(any(RacePlayer.class));
    }

    @Test
    void unknownMembershipIsRejectedBeforeLocks() {
        RacePlayer requester = fixture.racing(1L, 500.0, 1.0, ANCHOR);
        fixture.requester(requester);
        when(fixture.racePlayerRepository.existsByIdAndRaceId(1L, RACE_ID)).thenReturn(false);

        ApiException exception = assertThrows(ApiException.class, fixture::arbitrate);

        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, exception.getErrorCode());
        verify(fixture.racePlayerRepository, never()).findAllLockedByRaceIdOrderById(any());
    }

    @Test
    void finishedRequesterReconcilesOthersWithoutPresenceOrGameplayRevival() {
        RacePlayer requester = fixture.finished(1L, T - 500);
        RacePlayer rival = fixture.racing(2L, 998.0, 2.0, ANCHOR);
        fixture.requester(requester);
        fixture.online(rival);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(T - 750, rival.getFinishedAtEpochMs());
        assertEquals(2, response.getSnapshot().getRank());
        assertEquals(RaceStatus.FINISHED, fixture.race.getStatus());
        verify(fixture.presenceService, never()).resolve(requester, NOW);
        verify(fixture.presenceService, never()).recordGameplayActivity(requester, NOW);
        verify(fixture.presenceService, never()).renewPresenceLease(any(), any());
        verify(fixture.liveEventRecorder).recordPlayerFinished(rival);
        verify(fixture.liveEventRecorder, never()).recordPlayerFinished(requester);
        verify(fixture.liveEventRecorder).recordRaceFinished(fixture.race);
    }

    @Test
    void alreadyFinishedRaceRepeatsWithoutMutationOrEvents() {
        RacePlayer requester = fixture.finished(1L, T - 500);
        fixture.finished(2L, T - 300);
        fixture.race.setStatus(RaceStatus.FINISHED);
        fixture.requester(requester);

        StudentRaceFinishArbitrationResponse first = fixture.arbitrate();
        StudentRaceFinishArbitrationResponse second = fixture.arbitrate();

        assertEquals(2, first.getFinishOrder().getConfirmedFinishers().size());
        assertEquals(first.getFinishOrder().getConfirmedFinishers().size(),
                second.getFinishOrder().getConfirmedFinishers().size());
        assertTrue(first.getSnapshot().isRaceFinished());
        assertEquals(EVENT_VERSION, first.getFinishOrder().getEventVersion());
        verify(fixture.racePlayerRepository, never()).saveAllAndFlush(any());
        verifyNoInteractions(fixture.presenceService, fixture.liveEventRecorder);
    }

    @Test
    void retriesNeverEmitDuplicateTerminalEvents() {
        RacePlayer a = fixture.racing(1L, 998.0, 2.0, ANCHOR);
        RacePlayer b = fixture.racing(2L, 996.0, 2.0, ANCHOR);
        fixture.requester(a);
        fixture.online(a);
        fixture.online(b);

        fixture.arbitrate();
        fixture.arbitrate();
        fixture.arbitrate();

        verify(fixture.liveEventRecorder, times(1)).recordPlayerFinished(a);
        verify(fixture.liveEventRecorder, times(1)).recordPlayerFinished(b);
        verify(fixture.liveEventRecorder, times(1)).recordRaceFinished(fixture.race);
        verify(fixture.liveEventRecorder, never()).recordPlayerProgressUpdated(any());
        assertEquals(T - 750, a.getFinishedAtEpochMs());
        assertNotNull(fixture.race.getFinishedAt());
    }

    @Test
    void batchEventsRecordFinishersOnceThenGroupedProgressThenRaceFinish() {
        RacePlayer requester = fixture.racing(1L, 998.0, 2.0, ANCHOR);
        RacePlayer mover = fixture.racing(2L, 500.0, 1.0, ANCHOR);
        fixture.requester(requester);
        fixture.online(requester);
        fixture.online(mover);

        fixture.arbitrate();

        InOrder order = inOrder(fixture.liveEventRecorder, fixture.racePlayerRepository);
        order.verify(fixture.racePlayerRepository).saveAllAndFlush(any());
        order.verify(fixture.liveEventRecorder).recordPlayerFinished(requester);
        order.verify(fixture.liveEventRecorder, times(1)).recordPlayerProgressUpdated(fixture.race);
        verify(fixture.liveEventRecorder, never()).recordRaceFinished(any());
        assertEquals(504.0, mover.getPosition(), 1e-9);
        assertEquals(RaceStatus.IN_PROGRESS, fixture.race.getStatus());
    }

    @Test
    void absentRequesterRequiresReconnectAndOnlyItsOwnSettlementIsRecorded() {
        RacePlayer requester = fixture.racing(1L, 500.0, 1.0, ANCHOR);
        RacePlayer rival = fixture.racing(2L, 998.0, 2.0, ANCHOR);
        fixture.requester(requester);
        fixture.absent(requester, ANCHOR + 500);
        fixture.online(rival);

        ApiException exception = assertThrows(ApiException.class, fixture::arbitrate);

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, exception.getErrorCode());
        assertEquals(502.0, requester.getPosition(), 1e-9);
        assertEquals(998.0, rival.getPosition(), 1e-9);
        assertEquals(RacePlayerStatus.RACING, rival.getStatus());
        verify(fixture.presenceService, never()).resolve(rival, NOW);
        verify(fixture.liveEventRecorder).recordPlayerProgressUpdated(fixture.race);
        verify(fixture.liveEventRecorder, never()).recordPlayerFinished(any());
        verify(fixture.racePlayerRepository, never()).saveAllAndFlush(any());
    }

    @Test
    void clockBehindTheRosterYieldsNoSettlementAndNoProof() {
        RacePlayer requester = fixture.racing(1L, 998.0, 2.0, T + 5_000);
        fixture.requester(requester);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(RacePlayerStatus.RACING, requester.getStatus());
        assertNull(response.getFinishOrder().getConfirmedThroughEpochMs());
        assertTrue(response.getFinishOrder().getConfirmedFinishers().isEmpty());
        verifyNoInteractions(fixture.presenceService, fixture.liveEventRecorder);
    }

    @Test
    void responseCarriesTheSameSnapshotContractAsRaceState() {
        RacePlayer requester = fixture.racing(1L, 500.0, 1.0, ANCHOR);
        fixture.racing(2L, 600.0, 1.0, ANCHOR);
        fixture.requester(requester);
        fixture.online(requester);
        fixture.absent(fixture.players.get(1), ANCHOR);

        StudentRaceFinishArbitrationResponse response = fixture.arbitrate();

        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(2, response.getSnapshot().getPlayerCount());
        assertEquals(2, response.getSnapshot().getRank());
        assertEquals(1, response.getSnapshot().getOpponents().size());
        assertEquals(T, response.getSnapshot().getSnapshotAtEpochMs());
        assertEquals(4.0, response.getSnapshot().getMovementUnitsPerSecond());
        assertEquals(EVENT_VERSION, response.getSnapshot().getEventVersion());
    }

    @Test
    void apiExceptionsKeepTheRequesterSettlementLikeRaceState() throws NoSuchMethodException {
        Transactional transactional = StudentRaceFinishArbitrationService.class
                .getMethod("arbitrate", jakarta.servlet.http.HttpServletRequest.class)
                .getAnnotation(Transactional.class);

        assertTrue(Arrays.asList(transactional.noRollbackFor()).contains(ApiException.class));
    }
}
