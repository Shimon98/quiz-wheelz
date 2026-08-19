package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
    private QuestionTimeoutService questionTimeoutService;

    @Mock
    private RaceFinishService raceFinishService;

    private RaceMovementSettlementWorker worker;

    @BeforeEach
    void setUp() {
        worker = new RaceMovementSettlementWorker(
                racePlayerRepository,
                raceRepository,
                questionTimeoutService,
                raceFinishService,
                Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
        );
    }

    @Test
    void shouldSettleLockedRacingPlayerWithOverdueTimeoutHandling() {
        RacePlayer racePlayer = createPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        worker.settlePlayer(RACE_PLAYER_ID, RACE_ID);

        verify(questionTimeoutService).settleWithOverdueTimeout(
                racePlayer,
                LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE),
                FIXED_INSTANT.toEpochMilli()
        );
    }

    @Test
    void shouldSkipPlayerThatLeftRacingBeforeTheLockWasAcquired() {
        // The candidate list was unlocked — only the LOCKED row decides.
        RacePlayer finishedPlayer = createPlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(finishedPlayer));

        worker.settlePlayer(RACE_PLAYER_ID, RACE_ID);

        verify(questionTimeoutService, never())
                .settleWithOverdueTimeout(any(), any(), anyLong());
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

        verify(questionTimeoutService, never())
                .settleWithOverdueTimeout(any(), any(), anyLong());
    }

    @Test
    void shouldSkipMissingPlayer() {
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.empty());

        worker.settlePlayer(RACE_PLAYER_ID, RACE_ID);

        verify(questionTimeoutService, never())
                .settleWithOverdueTimeout(any(), any(), anyLong());
    }

    @Test
    void shouldFinalizeRaceUnderTheRaceLock() {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);

        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.of(race));

        worker.finalizeRaceIfComplete(RACE_ID);

        // The authoritative player re-check runs inside finishRaceIfNeeded,
        // AFTER the race lock was acquired — concurrent player finishes can
        // no longer strand the race IN_PROGRESS.
        verify(raceFinishService).finishRaceIfNeeded(race);
    }

    @Test
    void shouldSkipMissingRaceOnFinalization() {
        when(raceRepository.findLockedById(RACE_ID)).thenReturn(Optional.empty());

        worker.finalizeRaceIfComplete(RACE_ID);

        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    private RacePlayer createPlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);
        race.setTotalDistance(1000);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);

        return racePlayer;
    }
}
