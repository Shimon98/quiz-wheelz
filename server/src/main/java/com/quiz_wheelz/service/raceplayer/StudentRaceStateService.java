package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRacePlayerPresentationResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
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
    private final RaceLiveEventChangeRecorder liveEventChangeRecorder;
    private final RaceLiveMutationGate liveMutationGate;
    private final Clock clock;

    public StudentRaceStateService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerGameplayRequestGuard gameplayRequestGuard,
            RaceFinishService raceFinishService,
            StudentRaceStandingService standingService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            RaceLiveEventChangeRecorder liveEventChangeRecorder,
            RaceLiveMutationGate liveMutationGate,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.gameplayRequestGuard = Objects.requireNonNull(gameplayRequestGuard);
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.standingService = Objects.requireNonNull(standingService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.liveEventChangeRecorder = Objects.requireNonNull(liveEventChangeRecorder);
        this.liveMutationGate = Objects.requireNonNull(liveMutationGate);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public StudentRaceStateResponse getRaceState(HttpServletRequest request) {
        RacePlayer racePlayer = sessionLockService.lock(
                sessionLockService.resolveIdentity(request)
        );
        Race activeRace = liveMutationGate.lockIfActive(racePlayer).orElse(null);
        Race race = Objects.requireNonNull(racePlayer.getRace());
        PlayerLiveState playerBefore = activeRace == null
                ? null
                : liveEventChangeRecorder.capturePlayer(racePlayer);
        RaceLiveState raceBefore = activeRace == null
                ? null
                : liveEventChangeRecorder.captureRace(activeRace);

        try {
            return resolveRaceState(
                    racePlayer,
                    race,
                    activeRace,
                    playerBefore,
                    raceBefore
            );
        } catch (ApiException exception) {
            recordLiveChanges(activeRace, playerBefore, raceBefore, racePlayer);
            throw exception;
        }
    }

    private StudentRaceStateResponse resolveRaceState(
            RacePlayer racePlayer,
            Race race,
            Race activeRace,
            PlayerLiveState playerBefore,
            RaceLiveState raceBefore
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

        recordLiveChanges(activeRace, playerBefore, raceBefore, racePlayer);

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

    private void recordLiveChanges(
            Race activeRace,
            PlayerLiveState playerBefore,
            RaceLiveState raceBefore,
            RacePlayer racePlayer
    ) {
        if (activeRace == null) {
            return;
        }
        liveEventChangeRecorder.recordPlayerChange(playerBefore, racePlayer);
        liveEventChangeRecorder.recordRaceChange(raceBefore, activeRace);
    }
}
