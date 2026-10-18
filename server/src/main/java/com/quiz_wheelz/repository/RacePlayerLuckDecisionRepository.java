package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerLuckDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface RacePlayerLuckDecisionRepository extends JpaRepository<RacePlayerLuckDecision, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from RacePlayerLuckDecision d where d.racePlayer.id = :playerId and d.sourceQuestion.id = :questionId")
    Optional<RacePlayerLuckDecision> findLockedBySource(
            @Param("playerId") Long playerId,
            @Param("questionId") Long questionId);

    boolean existsByRacePlayerIdAndSourceQuestionId(Long playerId, Long questionId);

    List<RacePlayerLuckDecision> findByRacePlayerIdOrderByDecisionSequenceAsc(Long playerId);
}
