package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RacePlayerGameplayStateRepository extends JpaRepository<RacePlayerGameplayState, Long> {
    Optional<RacePlayerGameplayState> findByRacePlayerId(Long racePlayerId);
}
