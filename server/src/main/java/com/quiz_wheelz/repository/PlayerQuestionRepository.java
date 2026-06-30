package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerQuestionRepository extends JpaRepository<PlayerQuestion, Long> {

    Optional<PlayerQuestion> findByIdAndRacePlayer(
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

    boolean existsByRacePlayerAndStatus(
            RacePlayer racePlayer,
            PlayerQuestionStatus status
    );
}
