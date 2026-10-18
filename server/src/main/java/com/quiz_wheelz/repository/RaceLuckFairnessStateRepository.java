package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RaceLuckFairnessState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface RaceLuckFairnessStateRepository extends JpaRepository<RaceLuckFairnessState, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from RaceLuckFairnessState s where s.race.id = :raceId")
    Optional<RaceLuckFairnessState> findLockedByRaceId(@Param("raceId") Long raceId);

    Optional<RaceLuckFairnessState> findByRaceId(Long raceId);
}
