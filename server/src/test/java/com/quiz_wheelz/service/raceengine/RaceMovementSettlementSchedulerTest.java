package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RaceMovementSettlementSchedulerTest {

    @Test
    void shouldReconcileCandidateRaceEvenWhenDatabaseStillHasRacingRows() {
        RacePlayerRepository playerRepository = mock(RacePlayerRepository.class);
        RaceRepository raceRepository = mock(RaceRepository.class);
        RaceMovementSettlementWorker worker = mock(RaceMovementSettlementWorker.class);
        RacePlayerRepository.RacePlayerMovementCandidate candidate =
                mock(RacePlayerRepository.RacePlayerMovementCandidate.class);

        when(candidate.getPlayerId()).thenReturn(44L);
        when(candidate.getRaceId()).thenReturn(4L);
        when(playerRepository.findMovementSettlementCandidates(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        )).thenReturn(List.of(candidate));
        when(raceRepository.findRaceIdsWithoutPlayersInStatuses(
                RaceStatus.IN_PROGRESS,
                List.of(RacePlayerStatus.WAITING, RacePlayerStatus.RACING)
        )).thenReturn(List.of());

        new RaceMovementSettlementScheduler(
                playerRepository,
                raceRepository,
                worker
        ).runSettlementSweep();

        verify(worker).settlePlayer(44L, 4L);
        verify(worker).finalizeRaceIfComplete(4L);
    }
}
