package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RacePlayerFocusEventRepository
        extends JpaRepository<RacePlayerFocusEvent, Long> {

    Optional<RacePlayerFocusEvent> findByRacePlayerAndClientEventId(
            RacePlayer racePlayer,
            String clientEventId
    );

    long countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
            RacePlayer racePlayer,
            PlayerQuestion playerQuestion
    );
}
