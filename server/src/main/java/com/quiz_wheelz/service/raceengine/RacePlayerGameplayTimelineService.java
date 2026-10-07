package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.challenge.RacePlayerChallengeTimelineService;
import com.quiz_wheelz.service.challenge.ChallengeOfferService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;

@Service
public class RacePlayerGameplayTimelineService {

    private final QuestionTimeoutService questionTimeoutService;
    private final RaceMovementService raceMovementService;
    private final RacePlayerChallengeTimelineService challengeTimeline;
    private final ChallengeOfferService challengeOffers;

    public RacePlayerGameplayTimelineService(
            QuestionTimeoutService questionTimeoutService,
            RaceMovementService raceMovementService,
            RacePlayerChallengeTimelineService challengeTimeline,
            ChallengeOfferService challengeOffers
    ) {
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.raceMovementService = Objects.requireNonNull(raceMovementService);
        this.challengeTimeline = Objects.requireNonNull(challengeTimeline);
        this.challengeOffers = Objects.requireNonNull(challengeOffers);
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
        challengeOffers.cancelActive(terminalRacePlayer,
                terminalRacePlayer.getFinishedAtEpochMs() == null
                        ? (terminalRacePlayer.getMovementUpdatedAtEpochMs() == null
                            ? 0L : terminalRacePlayer.getMovementUpdatedAtEpochMs())
                        : terminalRacePlayer.getFinishedAtEpochMs());
        questionTimeoutService.expireActiveQuestionWithoutConsequence(terminalRacePlayer);
    }

    public void cancelTerminalChallenge(RacePlayer player, long epochMs) {
        challengeOffers.cancelActive(player, epochMs);
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

    public long resolvePlayerRequestCutoff(
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
        if (challengeTimeline.settle(lockedRacePlayer, decisionInstant.toEpochMilli(), movementCutoffEpochMs)) {
            return;
        }
        questionTimeoutService.settleWithOverdueTimeout(
                lockedRacePlayer,
                decisionInstant.toEpochMilli(),
                movementCutoffEpochMs
        );
    }
}
