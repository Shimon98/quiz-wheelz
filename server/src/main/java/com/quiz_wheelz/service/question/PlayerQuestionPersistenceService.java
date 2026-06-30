package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class PlayerQuestionPersistenceService {

    private final PlayerQuestionRepository playerQuestionRepository;
    private final Clock clock;

    @Autowired
    public PlayerQuestionPersistenceService(
            PlayerQuestionRepository playerQuestionRepository
    ) {
        this(playerQuestionRepository, Clock.systemDefaultZone());
    }

    PlayerQuestionPersistenceService(
            PlayerQuestionRepository playerQuestionRepository,
            Clock clock
    ) {
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public PlayerQuestion persistGeneratedQuestion(
            RacePlayer racePlayer,
            InternalGeneratedQuestion generatedQuestion
    ) {
        validateInput(racePlayer, generatedQuestion);

        PlayerQuestion playerQuestion = buildPlayerQuestion(
                racePlayer,
                generatedQuestion
        );

        addChoices(
                playerQuestion,
                generatedQuestion.getChoices()
        );

        return playerQuestionRepository.save(playerQuestion);
    }

    private PlayerQuestion buildPlayerQuestion(
            RacePlayer racePlayer,
            InternalGeneratedQuestion generatedQuestion
    ) {
        LocalDateTime now = LocalDateTime.now(clock);

        PlayerQuestion playerQuestion = new PlayerQuestion();
        playerQuestion.setRacePlayer(racePlayer);
        playerQuestion.setQuestionTemplate(generatedQuestion.getQuestionTemplate());
        playerQuestion.setQuestionText(generatedQuestion.getQuestionText());
        playerQuestion.setCorrectAnswerValue(generatedQuestion.getCorrectAnswerValue());
        playerQuestion.setTimeLimitSeconds(generatedQuestion.getTimeLimitSeconds());
        playerQuestion.setStatus(PlayerQuestionStatus.ACTIVE);
        playerQuestion.setExpiresAt(now.plusSeconds(generatedQuestion.getTimeLimitSeconds()));

        return playerQuestion;
    }

    private void addChoices(
            PlayerQuestion playerQuestion,
            List<InternalGeneratedQuestionChoice> generatedChoices
    ) {
        for (InternalGeneratedQuestionChoice generatedChoice : generatedChoices) {
            validateGeneratedChoice(generatedChoice);
            playerQuestion.addChoice(buildPlayerQuestionChoice(generatedChoice));
        }
    }

    private PlayerQuestionChoice buildPlayerQuestionChoice(
            InternalGeneratedQuestionChoice generatedChoice
    ) {
        PlayerQuestionChoice choice = new PlayerQuestionChoice();
        choice.setChoiceText(generatedChoice.getChoiceText());
        choice.setAnswerValue(generatedChoice.getAnswerValue());
        choice.setCorrect(generatedChoice.isCorrect());
        choice.setDisplayOrder(generatedChoice.getDisplayOrder());

        return choice;
    }

    private void validateInput(
            RacePlayer racePlayer,
            InternalGeneratedQuestion generatedQuestion
    ) {
        if (racePlayer == null || generatedQuestion == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }

        if (generatedQuestion.getQuestionTemplate() == null
                || isBlank(generatedQuestion.getQuestionText())
                || generatedQuestion.getCorrectAnswerValue() == null
                || generatedQuestion.getTimeLimitSeconds() == null
                || generatedQuestion.getChoices() == null
                || generatedQuestion.getChoices().isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateGeneratedChoice(
            InternalGeneratedQuestionChoice generatedChoice
    ) {
        if (generatedChoice == null
                || isBlank(generatedChoice.getChoiceText())
                || generatedChoice.getAnswerValue() == null
                || generatedChoice.getDisplayOrder() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
