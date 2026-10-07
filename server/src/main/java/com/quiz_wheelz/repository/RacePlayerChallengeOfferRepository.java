package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.enums.ChallengeOfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface RacePlayerChallengeOfferRepository extends JpaRepository<RacePlayerChallengeOffer, Long> {
    Optional<RacePlayerChallengeOffer> findByIdAndRacePlayerId(Long id, Long racePlayerId);

    Optional<RacePlayerChallengeOffer> findFirstByRacePlayerIdAndStatusOrderByIdDesc(
            Long racePlayerId, ChallengeOfferStatus status);

    Optional<RacePlayerChallengeOffer> findFirstByRacePlayerIdAndStatusInOrderByIdDesc(
            Long racePlayerId, Collection<ChallengeOfferStatus> statuses);
}
