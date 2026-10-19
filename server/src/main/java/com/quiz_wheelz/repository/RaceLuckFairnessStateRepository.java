package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RaceLuckFairnessState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface RaceLuckFairnessStateRepository extends JpaRepository<RaceLuckFairnessState, Long> {
    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true)
    @Query(value = """
            insert into race_luck_fairness_states (race_id, decision_sequence, created_at, updated_at)
            values (:raceId, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            on duplicate key update race_id = race_id
            """, nativeQuery = true)
    int initializeIfAbsent(@Param("raceId") Long raceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from RaceLuckFairnessState s where s.race.id = :raceId")
    Optional<RaceLuckFairnessState> findLockedByRaceId(@Param("raceId") Long raceId);

    Optional<RaceLuckFairnessState> findByRaceId(Long raceId);
}
