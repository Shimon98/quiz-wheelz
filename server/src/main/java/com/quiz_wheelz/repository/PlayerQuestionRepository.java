package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PlayerQuestionRepository extends JpaRepository<PlayerQuestion, Long> {

    Optional<PlayerQuestion> findByIdAndRacePlayer(
            Long id,
            RacePlayer racePlayer
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PlayerQuestion> findLockedByIdAndRacePlayer(
            Long id,
            RacePlayer racePlayer
    );

    Optional<PlayerQuestion> findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
            RacePlayer racePlayer,
            PlayerQuestionStatus status
    );

    List<PlayerQuestion> findByRacePlayerOrderByCreatedAtDesc(
            RacePlayer racePlayer
    );

    long countByRacePlayer(RacePlayer racePlayer);

    @Query("""
            select question from PlayerQuestion question
            where question.status in :statuses
              and question.updatedAt < :cutoff
              and not exists (
                  select decision.id from RacePlayerLuckDecision decision
                  where decision.sourceQuestion = question
              )
              and not exists (
                  select focusEvent.id from RacePlayerFocusEvent focusEvent
                  where focusEvent.playerQuestion = question
              )
            """)
    List<PlayerQuestion> findCleanupCandidates(
            @Param("statuses") Collection<PlayerQuestionStatus> statuses,
            @Param("cutoff") LocalDateTime cutoff
    );

    boolean existsByRacePlayerAndStatus(
            RacePlayer racePlayer,
            PlayerQuestionStatus status
    );

    List<PlayerQuestion> findByRacePlayerInAndStatus(
            Collection<RacePlayer> racePlayers,
            PlayerQuestionStatus status
    );
}
