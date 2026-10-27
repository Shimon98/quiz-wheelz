package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerChallengeOfferRepository;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayStateService;
import com.quiz_wheelz.service.raceplayer.StudentRaceStandingResult;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import com.quiz_wheelz.service.recovery.HiddenRecoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY, noRollbackFor = ApiException.class)
public class ChallengeOfferService {
    private final RacePlayerChallengeOfferRepository repository;
    private final RacePlayerGameplayStateService stateService;
    private final ChallengeEnergyService energyService;
    private final ChallengeEligibilityService eligibilityService;
    private final ChallengeQuestionAvailabilityService availability;
    private final ChallengeExecutionStateService executions;
    private final RacePlayerSpeedEffectService speedEffects;
    private final ObjectProvider<HiddenRecoveryService> recovery;

    @Transactional(propagation = Propagation.MANDATORY, readOnly = true)
    public Optional<RacePlayerChallengeOffer> unresolved(RacePlayer player) {
        return repository.findUnresolved(player.getId());
    }

    public void afterAnswer(RacePlayer player, PlayerQuestion question, Difficulty answeredDifficulty,
                            boolean correct, long decisionEpochMs, StudentRaceStandingResult standing) {
        if (question.getGameplayContext() != QuestionGameplayContext.NORMAL
                || player.getStatus() != RacePlayerStatus.RACING
                || player.getRace().getStatus() != RaceStatus.IN_PROGRESS) {
            return;
        }
        // S4-05: a wrong NORMAL answer earns nothing but still counts as evidence for Hidden Recovery.
        recovery.ifAvailable(service -> service.observeAcceptedAnswer(player, question, correct));
        if (!correct) {
            return;
        }
        var state = stateService.obtainForLockedPlayer(player);
        energyService.earn(state, answeredDifficulty, question.getGameplayContext(), correct);
        // The nudge lands before the offer check, so a meter it fills opens the offer with this same answer.
        recovery.ifAvailable(service -> service.nudgeAfterNormalGain(player, question, state, decisionEpochMs, standing));
        if (!eligibilityService.eligible(state, unresolved(player).isPresent()) || !availability.available(player)
                || speedEffects.findActiveAt(player, decisionEpochMs).stream()
                .anyMatch(effect -> effect.getType() == EffectType.SPEED_SLOW || effect.getType() == EffectType.SPEED_BOOST)) {
            return;
        }
        var offer = new RacePlayerChallengeOffer();
        offer.setRacePlayer(player);
        offer.setOfferedAtEpochMs(decisionEpochMs);
        offer.setExpiresAtEpochMs(Math.addExact(decisionEpochMs, ChallengeRules.OFFER_DURATION_MS));
        repository.save(offer);
        state.setChallengeEnergy(0);
    }

    public Optional<RacePlayerChallengeOffer> selectedReplay(RacePlayer player, long offerId,
                                                            ChallengeChoice choice) {
        return repository.findByIdAndRacePlayerId(offerId, player.getId())
                .filter(offer -> offer.getStatus() == ChallengeOfferStatus.SELECTED)
                .map(offer -> requireSameChoice(offer, choice));
    }

    private RacePlayerChallengeOffer requireSameChoice(RacePlayerChallengeOffer offer, ChallengeChoice choice) {
        if (offer.getChoice() != choice) {
            throw new ApiException(ErrorCode.CHALLENGE_CHOICE_CONFLICT);
        }
        return offer;
    }

    public RacePlayerChallengeOffer select(RacePlayer player, long offerId,
                                           ChallengeChoice choice, long decisionEpochMs) {
        var offer = repository.findByIdAndRacePlayerId(offerId, player.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.CHALLENGE_OFFER_NOT_FOUND));
        if (offer.getStatus() == ChallengeOfferStatus.SELECTED) {
            return requireSameChoice(offer, choice);
        }
        if (offer.getStatus() == ChallengeOfferStatus.EXPIRED) {
            throw new ApiException(ErrorCode.CHALLENGE_OFFER_EXPIRED);
        }
        if (offer.getStatus() != ChallengeOfferStatus.ACTIVE
                || decisionEpochMs < offer.getOfferedAtEpochMs()) {
            throw new ApiException(ErrorCode.CHALLENGE_OFFER_NOT_FOUND);
        }
        if (decisionEpochMs >= offer.getExpiresAtEpochMs()) {
            throw new ApiException(ErrorCode.CHALLENGE_OFFER_EXPIRED);
        }
        offer.setStatus(ChallengeOfferStatus.SELECTED);
        offer.setChoice(choice);
        offer.setResolvedAtEpochMs(decisionEpochMs);
        return offer;
    }

    public void expire(RacePlayerChallengeOffer offer) {
        offer.setStatus(ChallengeOfferStatus.EXPIRED);
        offer.setResolvedAtEpochMs(offer.getExpiresAtEpochMs());
        stateService.obtainForLockedPlayer(offer.getRacePlayer())
                .setChallengeEnergy(ChallengeRules.EXPIRY_RESTORE_ENERGY);
    }

    public void endUndeliverableRun(RacePlayer player, long decisionEpochMs) {
        if (executions.abort(player, decisionEpochMs)) {
            stateService.obtainForLockedPlayer(player).setChallengeEnergy(ChallengeRules.ENERGY_THRESHOLD);
        }
    }

    public void cancelActive(RacePlayer player, long decisionEpochMs) {
        executions.abort(player, decisionEpochMs);
        repository.findFirstByRacePlayerIdAndStatusOrderByIdDesc(player.getId(), ChallengeOfferStatus.ACTIVE)
                .ifPresent(offer -> {
                    offer.setStatus(ChallengeOfferStatus.CANCELLED);
                    offer.setResolvedAtEpochMs(decisionEpochMs);
                });
    }

    public void requireNormalQuestion(RacePlayer player) {
        unresolved(player).filter(offer -> offer.getStatus() == ChallengeOfferStatus.ACTIVE).ifPresent(offer -> {
            throw new ApiException(ErrorCode.CHALLENGE_CHOICE_REQUIRED);
        });
    }
}
