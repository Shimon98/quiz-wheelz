package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.student.StudentQuestionChoiceResponse;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StudentQuestionResponseMapperTest {

    private final StudentQuestionResponseMapper mapper =
            new StudentQuestionResponseMapper();

    @Test
    void shouldMapPlayerQuestionToSafeStudentResponse() {
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS
        );

        PlayerQuestion playerQuestion = createPlayerQuestion(expiresAt);
        playerQuestion.setId(10L);

        PlayerQuestionChoice firstChoice = createChoice("10", 10, false, 2);
        firstChoice.setId(102L);

        PlayerQuestionChoice secondChoice = createChoice("12", 12, true, 1);
        secondChoice.setId(101L);

        StudentQuestionResponse response = mapper.toResponse(
                playerQuestion,
                List.of(firstChoice, secondChoice)
        );

        assertEquals(10L, response.getQuestionId());
        assertEquals("6 + 6 = ?", response.getQuestionText());
        assertEquals(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS, response.getTimeLimitSeconds());
        assertEquals(expiresAt, response.getExpiresAt());
        assertEquals(2, response.getChoices().size());

        StudentQuestionChoiceResponse firstResponseChoice = response.getChoices().get(0);

        assertEquals(101L, firstResponseChoice.getChoiceId());
        assertEquals("12", firstResponseChoice.getChoiceText());
        assertEquals(1, firstResponseChoice.getDisplayOrder());
    }

    @Test
    void shouldRejectMissingPlayerQuestion() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> mapper.toResponse(null, List.of(createChoice("12", 12, true, 1)))
        );

        assertEquals(
                "Player question is required for student question response mapping",
                exception.getMessage()
        );
    }

    @Test
    void shouldRejectMissingChoices() {
        PlayerQuestion playerQuestion = createPlayerQuestion(
                LocalDateTime.now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> mapper.toResponse(playerQuestion, List.of())
        );

        assertEquals(
                "Player question choices are required for student question response mapping",
                exception.getMessage()
        );
    }

    private PlayerQuestion createPlayerQuestion(LocalDateTime expiresAt) {
        PlayerQuestion playerQuestion = new PlayerQuestion();
        playerQuestion.setQuestionText("6 + 6 = ?");
        playerQuestion.setCorrectAnswerValue(12);
        playerQuestion.setTimeLimitSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS);
        playerQuestion.setStatus(PlayerQuestionStatus.ACTIVE);
        playerQuestion.setExpiresAt(expiresAt);

        return playerQuestion;
    }

    private PlayerQuestionChoice createChoice(
            String choiceText,
            Integer answerValue,
            boolean correct,
            Integer displayOrder
    ) {
        PlayerQuestionChoice choice = new PlayerQuestionChoice();
        choice.setChoiceText(choiceText);
        choice.setAnswerValue(answerValue);
        choice.setCorrect(correct);
        choice.setDisplayOrder(displayOrder);

        return choice;
    }
}
