package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerLuckDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RacePlayerLuckDecisionRepository extends JpaRepository<RacePlayerLuckDecision, Long> {
    boolean existsByRacePlayerIdAndSourceQuestionId(Long playerId, Long questionId);

    List<RacePlayerLuckDecision> findByRacePlayerIdOrderByDecisionSequenceAsc(Long playerId);
}
