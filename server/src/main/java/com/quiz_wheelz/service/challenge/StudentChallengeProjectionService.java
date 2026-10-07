package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeOfferResponse;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.ChallengeOfferStatus;
import com.quiz_wheelz.enums.RacePlayerGameplayMode;
import com.quiz_wheelz.repository.RacePlayerGameplayStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentChallengeProjectionService {
    private final RacePlayerGameplayStateRepository states;
    private final ChallengeOfferService offers;

    public Projection resolve(RacePlayer player, boolean moving, long epochMs) {
        int energy = states.findByRacePlayerId(player.getId())
                .map(state -> state.getChallengeEnergy()).orElse(0);
        var current = moving ? offers.unresolved(player) : java.util.Optional
                .<com.quiz_wheelz.entitys.RacePlayerChallengeOffer>empty();
        RacePlayerGameplayMode mode = RacePlayerGameplayMode.NORMAL;
        StudentChallengeOfferResponse offerResponse = null;
        if (current.isPresent()) {
            var offer = current.get();
            if (offer.getStatus() == ChallengeOfferStatus.ACTIVE
                    && offer.getOfferedAtEpochMs() <= epochMs && epochMs < offer.getExpiresAtEpochMs()) {
                mode = RacePlayerGameplayMode.CHALLENGE_CHOICE;
                offerResponse = new StudentChallengeOfferResponse(offer.getId(), offer.getExpiresAtEpochMs(),
                        List.of(ChallengeChoice.TURBO_TRIAL, ChallengeChoice.SAFE_RUN));
            } else if (offer.getStatus() == ChallengeOfferStatus.SELECTED) {
                mode = switch (offer.getChoice()) {
                    case TURBO_TRIAL -> RacePlayerGameplayMode.TURBO_TRIAL;
                    case SAFE_RUN -> RacePlayerGameplayMode.SAFE_RUN;
                };
            }
        }
        return new Projection(mode, new StudentChallengeResponse(energy, ChallengeRules.ENERGY_THRESHOLD,
                offerResponse));
    }

    public record Projection(RacePlayerGameplayMode mode, StudentChallengeResponse challenge) {
    }
}
