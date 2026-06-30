package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerQuestionChoiceRepository extends JpaRepository<PlayerQuestionChoice, Long> {

    List<PlayerQuestionChoice> findByPlayerQuestionOrderByDisplayOrderAsc(
            PlayerQuestion playerQuestion
    );

    List<PlayerQuestionChoice> findByPlayerQuestionIdOrderByDisplayOrderAsc(
            Long playerQuestionId
    );

    Optional<PlayerQuestionChoice> findByIdAndPlayerQuestion(
            Long id,
            PlayerQuestion playerQuestion
    );
}
