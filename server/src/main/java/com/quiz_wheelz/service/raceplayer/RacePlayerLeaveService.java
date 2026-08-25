package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
import com.quiz_wheelz.utils.DateTimeUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class RacePlayerLeaveService {

    private final RacePlayerSessionLockService sessionLockService;
    private final RacePlayerDisconnectService disconnectService;
    private final RaceLiveEventChangeRecorder liveEventChangeRecorder;
    private final RaceLiveMutationGate liveMutationGate;
    private final Clock clock;

    public RacePlayerLeaveService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerDisconnectService disconnectService,
            RaceLiveEventChangeRecorder liveEventChangeRecorder,
            RaceLiveMutationGate liveMutationGate,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.disconnectService = Objects.requireNonNull(disconnectService);
        this.liveEventChangeRecorder = Objects.requireNonNull(liveEventChangeRecorder);
        this.liveMutationGate = Objects.requireNonNull(liveMutationGate);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public RacePlayerLeaveResponse leave(HttpServletRequest request) {
        RacePlayer racePlayer = sessionLockService.resolveAndLock(request);
        boolean liveMutation = liveMutationGate.lockIfActive(racePlayer).isPresent();
        PlayerLiveState playerBefore = liveMutation
                ? liveEventChangeRecorder.capturePlayer(racePlayer)
                : null;
        Instant nowInstant = clock.instant();
        LocalDateTime now = DateTimeUtils.toLocalDateTime(nowInstant, clock.getZone());

        disconnectService.disconnectForPlayerActivity(racePlayer, nowInstant);
        if (liveMutation) {
            liveEventChangeRecorder.recordPlayerChange(playerBefore, racePlayer);
        }

        return new RacePlayerLeaveResponse(
                racePlayer.getId(),
                now,
                racePlayer.getStatus()
        );
    }
}
