package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceResponse;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;
import com.quiz_wheelz.service.raceengine.RaceDecisionTimeService;
import com.quiz_wheelz.service.raceplayer.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class StudentChallengeChoiceService {
    private final RacePlayerSessionLockService sessionLocks;
    private final RaceLiveMutationTracker mutations;
    private final RaceDecisionTimeService decisionTimes;
    private final RacePlayerGameplayRequestGuard gameplayGuard;
    private final ChallengeOfferService offers;
    private final StudentRaceStandingService standings;
    private final StudentRaceRuntimeSnapshotService snapshots;
    private final Clock clock;

    @Transactional(noRollbackFor = ApiException.class)
    public StudentChallengeChoiceResponse choose(HttpServletRequest request, StudentChallengeChoiceRequest body) {
        ChallengeChoice choice = parse(body);
        var player = sessionLocks.resolveAndLock(request);
        var context = mutations.begin(player);
        try {
            long decision = context.active() ? decisionTimes.advance(player.getRace(), clock.millis()) : clock.millis();
            gameplayGuard.requireGameplayAccess(player, Instant.ofEpochMilli(decision));
            var selected = offers.selectedReplay(player, body.offerId(), choice).orElse(null);
            if (selected == null) {
                if (player.getStatus() != RacePlayerStatus.RACING) {
                    throw new ApiException(ErrorCode.RACE_PLAYER_NOT_RACING);
                }
                if (player.getRace().getStatus() != RaceStatus.IN_PROGRESS) {
                    throw new ApiException(ErrorCode.RACE_NOT_IN_PROGRESS);
                }
                selected = offers.select(player, body.offerId(), choice, decision);
            }
            mutations.recordChanges(context, player);
            return new StudentChallengeChoiceResponse(selected.getId(), selected.getChoice(),
                    selected.getResolvedAtEpochMs(), snapshots.fromRacePlayer(player,
                    standings.calculate(player, decision), decision, player.getRace().getLiveEventVersion()));
        } catch (ApiException exception) {
            mutations.recordChanges(context, player);
            throw exception;
        }
    }

    private ChallengeChoice parse(StudentChallengeChoiceRequest body) {
        if (body == null || body.offerId() == null || body.offerId() <= 0 || body.choice() == null) {
            throw new ApiException(ErrorCode.INVALID_CHALLENGE_CHOICE);
        }
        try {
            return ChallengeChoice.valueOf(body.choice());
        } catch (IllegalArgumentException exception) {
            throw new ApiException(ErrorCode.INVALID_CHALLENGE_CHOICE);
        }
    }
}
