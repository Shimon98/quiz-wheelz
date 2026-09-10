package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;

@Service
public class RacePlayerGameplayTimelineService {

    private final QuestionTimeoutService questionTimeoutService;
    private final RaceMovementService raceMovementService;

    public RacePlayerGameplayTimelineService(
            QuestionTimeoutService questionTimeoutService,
            RaceMovementService raceMovementService
    ) {
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.raceMovementService = Objects.requireNonNull(raceMovementService);
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
            settle(lockedRacePlayer, decisionInstant, decisionInstant.toEpochMilli());
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

        markDisconnected(lockedRacePlayer);
        return true;
    }

    public void expireActiveQuestionForTerminalPlayer(RacePlayer terminalRacePlayer) {
        questionTimeoutService.expireActiveQuestionWithoutConsequence(terminalRacePlayer);
    }

    private boolean disconnectWhenGraceExpired(
            RacePlayer racePlayer,
            GameplayPresenceDecision presenceDecision
    ) {
        if (!presenceDecision.graceExpired()
                || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return false;
        }

        markDisconnected(racePlayer);
        return true;
    }

    private void markDisconnected(RacePlayer racePlayer) {
        racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
        expireActiveQuestionForTerminalPlayer(racePlayer);
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
        questionTimeoutService.settleWithOverdueTimeout(
                lockedRacePlayer,
                decisionInstant.toEpochMilli(),
                movementCutoffEpochMs
        );
    }
}
