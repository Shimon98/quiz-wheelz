package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.ChallengeOfferStatus;
import com.quiz_wheelz.enums.EffectSource;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class RacePlayerChallengeTimelineService {
    private final ChallengeOfferService offers;
    private final RaceMovementService movement;
    private final RacePlayerSpeedEffectService effects;

    public boolean settle(RacePlayer player, long decisionEpochMs, long movementCutoffEpochMs) {
        if (player.getStatus() != RacePlayerStatus.RACING
                || player.getRace().getStatus() != RaceStatus.IN_PROGRESS) {
            offers.cancelActive(player, decisionEpochMs);
            return true;
        }
        var current = offers.unresolved(player);
        if (current.isEmpty() || current.get().getStatus() != ChallengeOfferStatus.ACTIVE) {
            return false;
        }
        var offer = current.get();
        long expiry = offer.getExpiresAtEpochMs();
        long cutoff = Math.min(decisionEpochMs, movementCutoffEpochMs);
        movement.settleTo(player, Math.min(cutoff, expiry));
        if (player.getStatus() != RacePlayerStatus.RACING) {
            offers.cancelActive(player, player.getFinishedAtEpochMs() == null
                    ? decisionEpochMs : player.getFinishedAtEpochMs());
            return true;
        }
        if (decisionEpochMs >= expiry) {
            offers.expire(offer);
            effects.createSlowdownForLockedPlayer(player, EffectSource.CHALLENGE_TIMEOUT,
                    ChallengeRules.HESITATION_MAGNITUDE_TENTHS, expiry,
                    Math.addExact(expiry, ChallengeRules.HESITATION_DURATION_MS));
            movement.settleTo(player, cutoff);
        }
        return true;
    }
}
