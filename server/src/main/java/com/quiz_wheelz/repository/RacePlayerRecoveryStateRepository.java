package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerRecoveryState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RacePlayerRecoveryStateRepository extends JpaRepository<RacePlayerRecoveryState, Long> {
    Optional<RacePlayerRecoveryState> findByRacePlayerId(Long racePlayerId);
}
