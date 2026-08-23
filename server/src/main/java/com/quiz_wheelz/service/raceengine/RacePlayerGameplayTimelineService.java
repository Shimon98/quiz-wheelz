package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class RacePlayerGameplayTimelineService {

    private final QuestionTimeoutService questionTimeoutService;
    private final RaceMovementService raceMovementService;
    private final Clock clock;

    public RacePlayerGameplayTimelineService(
            QuestionTimeoutService questionTimeoutService,
            RaceMovementService raceMovementService,
            Clock clock
    ) {
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.raceMovementService = Objects.requireNonNull(raceMovementService);
        this.clock = Objects.requireNonNull(clock);
    }

    public boolean settleBackground(
            RacePlayer lockedRacePlayer,
            Instant decisionInstant,
            GameplayPresenceDecision presenceDecision
    ) {
        settle(
                lockedRacePlayer,
                decisionInstant,
                presenceDecision.movementCutoffEpochMs()
        );
        return disconnectWhenGraceExpired(lockedRacePlayer, presenceDecision);
    }

    public boolean settleGameplayRequest(
            RacePlayer lockedRacePlayer,
            Instant decisionInstant,
            GameplayPresenceDecision presenceDecision
    ) {
        settle(
                lockedRacePlayer,
                decisionInstant,
                resolvePlayerRequestCutoff(decisionInstant, presenceDecision)
        );
        return disconnectWhenGraceExpired(lockedRacePlayer, presenceDecision);
    }

    public boolean settleReconnect(
            RacePlayer lockedRacePlayer,
            Instant decisionInstant,
            GameplayPresenceDecision presenceDecision
    ) {
        settle(
                lockedRacePlayer,
                decisionInstant,
                resolvePlayerRequestCutoff(decisionInstant, presenceDecision)
        );

        if (!presenceDecision.graceExpired()
                && presenceDecision.requiresResume()
                && lockedRacePlayer.getStatus() == RacePlayerStatus.RACING) {
            raceMovementService.reanchorAt(
                    lockedRacePlayer,
                    decisionInstant.toEpochMilli()
            );
        }

        return disconnectWhenGraceExpired(lockedRacePlayer, presenceDecision);
    }

    public boolean settleForRaceFinalization(
            RacePlayer lockedRacePlayer,
            Instant decisionInstant,
            GameplayPresenceDecision presenceDecision
    ) {
        settle(
                lockedRacePlayer,
                decisionInstant,
                presenceDecision.movementCutoffEpochMs()
        );

        if (lockedRacePlayer.getStatus() != RacePlayerStatus.RACING) {
            return false;
        }

        lockedRacePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
        return true;
    }

    private boolean disconnectWhenGraceExpired(
            RacePlayer racePlayer,
            GameplayPresenceDecision presenceDecision
    ) {
        if (!presenceDecision.graceExpired()
                || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return false;
        }

        racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
        return true;
    }

    private long resolvePlayerRequestCutoff(
            Instant decisionInstant,
            GameplayPresenceDecision presenceDecision
    ) {
        return presenceDecision.requiresResume() || presenceDecision.graceExpired()
                ? presenceDecision.movementCutoffEpochMs()
                : decisionInstant.toEpochMilli();
    }

    private void settle(
            RacePlayer lockedRacePlayer,
            Instant decisionInstant,
            long movementCutoffEpochMs
    ) {
        LocalDateTime decisionNow = DateTimeUtils.toLocalDateTime(
                decisionInstant,
                clock.getZone()
        );
        questionTimeoutService.settleWithOverdueTimeout(
                lockedRacePlayer,
                decisionNow,
                decisionInstant.toEpochMilli(),
                movementCutoffEpochMs
        );
    }
}
