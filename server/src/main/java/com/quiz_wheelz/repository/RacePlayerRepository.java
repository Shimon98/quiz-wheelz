package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RacePlayerRepository extends JpaRepository<RacePlayer, Long> {

    List<RacePlayer> findByRaceOrderByLaneNumberAsc(Race race);

    List<RacePlayer> findByRaceOrderByPositionDesc(Race race);

    List<RacePlayer> findByRaceAndStatusOrderByLaneNumberAsc(
            Race race,
            RacePlayerStatus status
    );

    Optional<RacePlayer> findByIdAndRace(Long playerId, Race race);

    long countByRace(Race race);

    boolean existsByRaceAndLaneNumber(Race race, Integer laneNumber);

    boolean existsByRaceAndDisplayNameIgnoreCase(Race race, String displayName);

    boolean existsByRaceAndDisplayName(Race race, String displayName);
}