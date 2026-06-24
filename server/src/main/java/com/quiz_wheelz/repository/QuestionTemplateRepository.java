package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionTemplateRepository extends JpaRepository<QuestionTemplate, Long> {

    List<QuestionTemplate> findBySubjectAndActiveTrueOrderByDifficultyAsc(Subject subject);

    List<QuestionTemplate> findBySubjectAndDifficultyAndActiveTrue(
            Subject subject,
            Difficulty difficulty
    );

    List<QuestionTemplate> findBySubjectAndTypeAndDifficultyAndActiveTrue(
            Subject subject,
            QuestionType type,
            Difficulty difficulty
    );

    List<QuestionTemplate> findBySubjectAndTypeAndDifficultyAndActiveTrueOrderByIdAsc(
            Subject subject,
            QuestionType type,
            Difficulty difficulty
    );
}
