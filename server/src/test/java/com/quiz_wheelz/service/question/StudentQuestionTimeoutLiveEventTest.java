package com.quiz_wheelz.service.question;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentQuestionTimeoutLiveEventTest {

    private StudentQuestionDeliveryTestFixture fixture;
    private RacePlayer requestPlayer;
    private RacePlayer lockedPlayer;

    @BeforeEach
    void setUp() {
        fixture = new StudentQuestionDeliveryTestFixture();
        requestPlayer = fixture.createRacePlayer();
        lockedPlayer = fixture.createRacePlayer();
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(lockedPlayer));
    }

    @Test
    void timeoutSettlementVisibleChangeRecordsProgressBeforeReturningError() {
        doAnswer(invocation -> {
            lockedPlayer.setPosition(25.0);
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED);
        }).when(fixture.gameplayRequestGuard).requireGameplayAccess(any(), any());

        assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(requestPlayer)
        );

        InOrder mutationOrder = inOrder(
                fixture.racePlayerRepository,
                fixture.liveMutationGate,
                fixture.gameplayRequestGuard
        );
        mutationOrder.verify(fixture.racePlayerRepository)
                .findLockedByIdAndRaceId(
                        StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                        StudentQuestionDeliveryTestFixture.RACE_ID
                );
        mutationOrder.verify(fixture.liveMutationGate).lockIfActive(lockedPlayer);
        mutationOrder.verify(fixture.gameplayRequestGuard)
                .requireGameplayAccess(any(), any());

        verify(fixture.liveEventRecorder)
                .recordPlayerProgressUpdated(lockedPlayer.getRace());
    }

    @Test
    void timeoutTerminalTransitionsRecordPlayerThenRaceFinish() {
        doAnswer(invocation -> {
            lockedPlayer.setStatus(RacePlayerStatus.FINISHED);
            lockedPlayer.setFinishedAt(fixture.now());
            lockedPlayer.getRace().setStatus(RaceStatus.FINISHED);
            lockedPlayer.getRace().setFinishedAt(fixture.now());
            return null;
        }).when(fixture.gameplayRequestGuard).requireGameplayAccess(any(), any());

        assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(requestPlayer)
        );

        InOrder order = inOrder(fixture.liveEventRecorder);
        order.verify(fixture.liveEventRecorder).recordPlayerFinished(lockedPlayer);
        order.verify(fixture.liveEventRecorder).recordRaceFinished(lockedPlayer.getRace());
    }
}
