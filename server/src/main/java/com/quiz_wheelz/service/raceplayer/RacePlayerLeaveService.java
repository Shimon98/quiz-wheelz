package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.entitys.RacePlayer;
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
    private final Clock clock;

    public RacePlayerLeaveService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerDisconnectService disconnectService,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.disconnectService = Objects.requireNonNull(disconnectService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public RacePlayerLeaveResponse leave(HttpServletRequest request) {
        RacePlayer racePlayer = sessionLockService.resolveAndLock(request);
        Instant nowInstant = clock.instant();
        LocalDateTime now = DateTimeUtils.toLocalDateTime(nowInstant, clock.getZone());

        disconnectService.disconnectForPlayerActivity(racePlayer, nowInstant);

        return new RacePlayerLeaveResponse(
                racePlayer.getId(),
                now,
                racePlayer.getStatus()
        );
    }
}
