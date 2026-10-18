package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface RacePlayerGameplayStateRepository extends JpaRepository<RacePlayerGameplayState, Long> {
    Optional<RacePlayerGameplayState> findByRacePlayerId(Long racePlayerId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from RacePlayerGameplayState s where s.racePlayer.id = :playerId")
    Optional<RacePlayerGameplayState> findLockedByRacePlayerId(
            @Param("playerId") Long playerId);
}
