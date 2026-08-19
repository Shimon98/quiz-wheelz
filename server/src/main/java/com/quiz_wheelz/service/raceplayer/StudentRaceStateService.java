package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.utils.DateTimeUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Race-state read with movement materialization (C1-03M): position advances
 * continuously with server time, so a snapshot must first settle the locked
 * player (honoring an overdue timeout) up to one decision instant. The
 * endpoint stays a GET — settling deterministic elapsed-time state is not a
 * game action, repeated reads award nothing and are idempotent over time.
 */
@Service
public class StudentRaceStateService {

    private final CurrentRacePlayerService currentRacePlayerService;
    private final RacePlayerRepository racePlayerRepository;
    private final QuestionTimeoutService questionTimeoutService;
    private final RaceFinishService raceFinishService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;
    private final Clock clock;

    public StudentRaceStateService(
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerRepository racePlayerRepository,
            QuestionTimeoutService questionTimeoutService,
            RaceFinishService raceFinishService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            Clock clock
    ) {
        this.currentRacePlayerService = Objects.requireNonNull(currentRacePlayerService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public StudentRaceStateResponse getRaceState(HttpServletRequest request) {
        RacePlayer sessionRacePlayer =
                currentRacePlayerService.resolveCurrentRacePlayerSession(request);

        // Settlement writes — serialize with answers/questions through the
        // same PESSIMISTIC_WRITE player lock (a no-op for non-RACING states).
        RacePlayer racePlayer = racePlayerRepository
                .findLockedByIdAndRaceId(
                        sessionRacePlayer.getId(),
                        Objects.requireNonNull(sessionRacePlayer.getRace()).getId()
                )
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));

        Race race = Objects.requireNonNull(racePlayer.getRace());

        Instant decisionInstant = clock.instant();
        LocalDateTime decisionNow =
                DateTimeUtils.toLocalDateTime(decisionInstant, clock.getZone());
        long decisionEpochMs = decisionInstant.toEpochMilli();

        boolean wasRacing = racePlayer.getStatus() == RacePlayerStatus.RACING;

        questionTimeoutService.settleWithOverdueTimeout(
                racePlayer,
                decisionNow,
                decisionEpochMs
        );

        // Immediate raceFinished truth when THIS settlement crossed the line;
        // the scheduler's reconciliation pass remains the concurrent-finish
        // safety net.
        if (wasRacing && racePlayer.getStatus() == RacePlayerStatus.FINISHED) {
            raceFinishService.finishRaceIfNeeded(race);
        }

        StudentRaceRuntimeSnapshotResponse snapshot =
                snapshotMapper.fromRacePlayer(racePlayer, decisionEpochMs);

        return new StudentRaceStateResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getStartedAt(),
                race.getFinishedAt(),
                snapshot
        );
    }
}
