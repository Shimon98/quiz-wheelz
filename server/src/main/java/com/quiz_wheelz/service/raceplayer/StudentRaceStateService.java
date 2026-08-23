package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRacePlayerPresentationResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;

@Service
public class StudentRaceStateService {

    private final CurrentRacePlayerService currentRacePlayerService;
    private final RacePlayerRepository racePlayerRepository;
    private final RacePlayerGameplayRequestGuard gameplayRequestGuard;
    private final RaceFinishService raceFinishService;
    private final StudentRaceStandingService standingService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;
    private final Clock clock;

    public StudentRaceStateService(
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerRepository racePlayerRepository,
            RacePlayerGameplayRequestGuard gameplayRequestGuard,
            RaceFinishService raceFinishService,
            StudentRaceStandingService standingService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            Clock clock
    ) {
        this.currentRacePlayerService = Objects.requireNonNull(currentRacePlayerService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.gameplayRequestGuard = Objects.requireNonNull(gameplayRequestGuard);
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.standingService = Objects.requireNonNull(standingService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public StudentRaceStateResponse getRaceState(HttpServletRequest request) {
        RacePlayer sessionRacePlayer =
                currentRacePlayerService.resolveCurrentRacePlayerSession(request);

        RacePlayer racePlayer = racePlayerRepository
                .findLockedByIdAndRaceId(
                        sessionRacePlayer.getId(),
                        Objects.requireNonNull(sessionRacePlayer.getRace()).getId()
                )
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));

        Race race = Objects.requireNonNull(racePlayer.getRace());

        Instant decisionInstant = clock.instant();
        long decisionEpochMs = decisionInstant.toEpochMilli();

        boolean wasRacing = racePlayer.getStatus() == RacePlayerStatus.RACING;

        gameplayRequestGuard.requireGameplayAccess(racePlayer, decisionInstant);

        if (wasRacing && racePlayer.getStatus() == RacePlayerStatus.FINISHED) {
            raceFinishService.finishRaceIfNeeded(race);
        }

        StudentRaceStandingResult standing = standingService.calculate(racePlayer);
        StudentRaceRuntimeSnapshotResponse snapshot = snapshotMapper.fromRacePlayer(
                racePlayer,
                standing,
                decisionEpochMs
        );

        return new StudentRaceStateResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getStartedAt(),
                race.getFinishedAt(),
                StudentRacePlayerPresentationResponse.from(racePlayer),
                snapshot
        );
    }
}
