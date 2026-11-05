package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.dto.liveevent.RacePublicMoment;
import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.entitys.RacePlayerLuckDecision;
import com.quiz_wheelz.enums.ChallengeOutcome;
import com.quiz_wheelz.enums.LuckEventType;
import com.quiz_wheelz.enums.LuckOutcome;
import com.quiz_wheelz.enums.RacePublicMomentKind;
import com.quiz_wheelz.service.luck.LuckAnswerResult;

import java.util.List;
import java.util.Map;

// S4-06: maps the facts one accepted answer already produced to the public moments its QUESTION_ANSWERED event carries.
// Pure: no database, no clock, no positions. Luck counts on a wrong NORMAL answer too (it is not a learning failure);
// a student's failure (a lost Turbo, an imperfect Safe run) and Hidden Recovery never become public.
public class RacePublicMomentPolicy {
    private static final Map<LuckEventType, RacePublicMomentKind> APPLIED_LUCK = Map.of(
            LuckEventType.TAILWIND, RacePublicMomentKind.LUCK_TAILWIND,
            LuckEventType.ENERGY_ORB, RacePublicMomentKind.LUCK_ENERGY_ORB,
            LuckEventType.MUD_SPLASH, RacePublicMomentKind.LUCK_MUD);
    private static final Map<ChallengeOutcome, RacePublicMomentKind> WON_CHALLENGE = Map.of(
            ChallengeOutcome.TURBO_SUCCESS, RacePublicMomentKind.TURBO_SUCCESS,
            ChallengeOutcome.SAFE_PERFECT, RacePublicMomentKind.SAFE_PERFECT);

    public List<RacePublicMoment> forNormalAnswer(Long questionId, LuckAnswerResult luck) {
        if (luck.shieldAwarded()) {
            return List.of(new RacePublicMoment(RacePublicMomentKind.SHIELD_EARNED, questionId));
        }
        return luck.decision().map(this::forLuckDecision).orElse(List.of());
    }

    // outcomeBefore is the offer's outcome before this answer: only the answer that ended the challenge tells it.
    public List<RacePublicMoment> forChallengeAnswer(RacePlayerChallengeOffer offer, ChallengeOutcome outcomeBefore) {
        // Map.of rejects a null key, and a running challenge has no outcome yet.
        if (offer == null || outcomeBefore != null || offer.getOutcome() == null
                || !WON_CHALLENGE.containsKey(offer.getOutcome())) {
            return List.of();
        }
        return List.of(new RacePublicMoment(WON_CHALLENGE.get(offer.getOutcome()), offer.getId()));
    }

    // Named by what the server applied, not by what it drew: a Tailwind at top speed is applied as an Energy Orb.
    private List<RacePublicMoment> forLuckDecision(RacePlayerLuckDecision decision) {
        if (decision.getOutcome() == LuckOutcome.BLOCKED_BY_SHIELD && decision.getAppliedType() == LuckEventType.MUD_SPLASH) {
            return List.of(new RacePublicMoment(RacePublicMomentKind.LUCK_SHIELD_BLOCKED, decision.getId()));
        }
        if (decision.getOutcome() != LuckOutcome.APPLIED || decision.getAppliedType() == null
                || !APPLIED_LUCK.containsKey(decision.getAppliedType())) {
            return List.of();
        }
        return List.of(new RacePublicMoment(APPLIED_LUCK.get(decision.getAppliedType()), decision.getId()));
    }
}
