package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.student.StudentQuestionChoiceResponse;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class StudentQuestionResponseMapper {

    private static final String INVALID_PLAYER_QUESTION_ERROR_MESSAGE =
            "Player question is required for student question response mapping";

    private static final String INVALID_PLAYER_QUESTION_CHOICES_ERROR_MESSAGE =
            "Player question choices are required for student question response mapping";

    public StudentQuestionResponse toResponse(
            PlayerQuestion playerQuestion,
            List<PlayerQuestionChoice> choices
    ) {
        validateMappingInput(playerQuestion, choices);

        return new StudentQuestionResponse(
                playerQuestion.getId(),
                playerQuestion.getQuestionText(),
                playerQuestion.getTimeLimitSeconds(),
                playerQuestion.getExpiresAt(),
                choices.stream()
                        .sorted(Comparator.comparing(PlayerQuestionChoice::getDisplayOrder))
                        .map(this::toChoiceResponse)
                        .toList()
        );
    }

    private StudentQuestionChoiceResponse toChoiceResponse(
            PlayerQuestionChoice choice
    ) {
        return new StudentQuestionChoiceResponse(
                choice.getId(),
                choice.getChoiceText(),
                choice.getDisplayOrder()
        );
    }

    private void validateMappingInput(
            PlayerQuestion playerQuestion,
            List<PlayerQuestionChoice> choices
    ) {
        if (playerQuestion == null) {
            throw new IllegalArgumentException(INVALID_PLAYER_QUESTION_ERROR_MESSAGE);
        }

        if (choices == null || choices.isEmpty()) {
            throw new IllegalArgumentException(INVALID_PLAYER_QUESTION_CHOICES_ERROR_MESSAGE);
        }
    }
}
