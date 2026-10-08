package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.enums.ChallengeOfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Optional;

public interface RacePlayerChallengeOfferRepository extends JpaRepository<RacePlayerChallengeOffer, Long> {
    Optional<RacePlayerChallengeOffer> findFirstByRacePlayerIdAndStatusAndExecutionEndedAtEpochMsIsNullOrderByIdDesc(
            Long playerId, ChallengeOfferStatus status);

    Optional<RacePlayerChallengeOffer> findFirstByRacePlayerIdAndOutcomeIsNotNullOrderByExecutionEndedAtEpochMsDescIdDesc(
            Long playerId);

    @Query("select o from RacePlayerChallengeOffer o where o.racePlayer.id = :playerId "
            + "and (o.status = com.quiz_wheelz.enums.ChallengeOfferStatus.ACTIVE or "
            + "(o.status = com.quiz_wheelz.enums.ChallengeOfferStatus.SELECTED and o.executionEndedAtEpochMs is null)) "
            + "order by o.id desc limit 1")
    Optional<RacePlayerChallengeOffer> findUnresolved(Long playerId);

    Optional<RacePlayerChallengeOffer> findByIdAndRacePlayerId(Long id, Long racePlayerId);

    Optional<RacePlayerChallengeOffer> findFirstByRacePlayerIdAndStatusOrderByIdDesc(
            Long racePlayerId, ChallengeOfferStatus status);

    Optional<RacePlayerChallengeOffer> findFirstByRacePlayerIdAndStatusInOrderByIdDesc(
            Long racePlayerId, Collection<ChallengeOfferStatus> statuses);
}
