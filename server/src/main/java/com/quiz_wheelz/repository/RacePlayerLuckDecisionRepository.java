package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.RacePlayerLuckDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RacePlayerLuckDecisionRepository extends JpaRepository<RacePlayerLuckDecision, Long> {
    List<RacePlayerLuckDecision> findByRacePlayerIdAndOutcomeInOrderByIdAsc(
            Long playerId, java.util.Collection<com.quiz_wheelz.enums.LuckOutcome> outcomes,
            org.springframework.data.domain.Pageable limit);

    boolean existsByRacePlayerIdAndSourceQuestionId(Long playerId, Long questionId);

    List<RacePlayerLuckDecision> findByRacePlayerIdOrderByDecisionSequenceAsc(Long playerId);
}
