package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
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

    public PlayerQuestionPersistenceService(
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
        return persistGeneratedQuestion(racePlayer, generatedQuestion, QuestionGameplayContext.NORMAL, null,
                generatedQuestion == null ? null : generatedQuestion.getTimeLimitSeconds());
    }

    @Transactional
    public PlayerQuestion persistGeneratedQuestion(RacePlayer racePlayer, InternalGeneratedQuestion generatedQuestion,
                                                   QuestionGameplayContext context, RacePlayerChallengeOffer offer,
                                                   Integer timeLimitSeconds) {
        validateInput(racePlayer, generatedQuestion);
        if (context == null || timeLimitSeconds == null || timeLimitSeconds <= 0
                || (context == QuestionGameplayContext.NORMAL) != (offer == null)
                || (offer != null && (!Objects.equals(offer.getRacePlayer().getId(), racePlayer.getId())
                    || offer.getStatus() != com.quiz_wheelz.enums.ChallengeOfferStatus.SELECTED
                    || offer.getExecutionEndedAtEpochMs() != null
                    || context != QuestionGameplayContext.valueOf(offer.getChoice().name())))) {
            throw new ApiException(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID);
        }

        PlayerQuestion playerQuestion = buildPlayerQuestion(
                racePlayer,
                generatedQuestion
        );

        playerQuestion.setGameplayContext(context);
        playerQuestion.setChallengeOffer(offer);
        if (context != QuestionGameplayContext.NORMAL) {
            playerQuestion.setTimeLimitSeconds(timeLimitSeconds);
            playerQuestion.setExpiresAt(LocalDateTime.now(clock).plusSeconds(timeLimitSeconds));
        }
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
        playerQuestion.setGameplayContext(QuestionGameplayContext.NORMAL);
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
