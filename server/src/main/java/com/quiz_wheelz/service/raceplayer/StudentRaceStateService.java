package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRacePlayerPresentationResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationContext;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;

@Service
public class StudentRaceStateService {

    private final RacePlayerSessionLockService sessionLockService;
    private final RacePlayerGameplayRequestGuard gameplayRequestGuard;
    private final RaceFinishService raceFinishService;
    private final StudentRaceStandingService standingService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;
    private final RaceLiveMutationTracker liveMutationTracker;
    private final Clock clock;

    public StudentRaceStateService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerGameplayRequestGuard gameplayRequestGuard,
            RaceFinishService raceFinishService,
            StudentRaceStandingService standingService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            RaceLiveMutationTracker liveMutationTracker,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.gameplayRequestGuard = Objects.requireNonNull(gameplayRequestGuard);
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.standingService = Objects.requireNonNull(standingService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.liveMutationTracker = Objects.requireNonNull(liveMutationTracker);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public StudentRaceStateResponse getRaceState(HttpServletRequest request) {
        RacePlayer racePlayer = sessionLockService.lock(
                sessionLockService.resolveIdentity(request)
        );
        RaceLiveMutationContext liveContext = liveMutationTracker.begin(racePlayer);
        Race race = Objects.requireNonNull(racePlayer.getRace());

        try {
            return resolveRaceState(
                    racePlayer,
                    race,
                    liveContext
            );
        } catch (ApiException exception) {
            liveMutationTracker.recordChanges(liveContext, racePlayer);
            throw exception;
        }
    }

    private StudentRaceStateResponse resolveRaceState(
            RacePlayer racePlayer,
            Race race,
            RaceLiveMutationContext liveContext
    ) {

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

        liveMutationTracker.recordChanges(liveContext, racePlayer);

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
