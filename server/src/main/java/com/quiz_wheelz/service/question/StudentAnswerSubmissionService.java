package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class StudentAnswerSubmissionService {

    private final PlayerQuestionRepository playerQuestionRepository;
    private final PlayerQuestionChoiceRepository playerQuestionChoiceRepository;
    private final Clock clock;

    @Autowired
    public StudentAnswerSubmissionService(
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository
    ) {
        this(
                playerQuestionRepository,
                playerQuestionChoiceRepository,
                Clock.systemDefaultZone()
        );
    }

    StudentAnswerSubmissionService(
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            Clock clock
    ) {
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public SubmitAnswerResponse submitAnswer(
            RacePlayer racePlayer,
            SubmitAnswerRequest request
    ) {
        validateInput(racePlayer, request);

        LocalDateTime now = LocalDateTime.now(clock);

        PlayerQuestion question = findPlayerQuestion(
                request.getQuestionId(),
                racePlayer
        );

        validateQuestionIsActive(question);
        expireQuestionIfNeeded(question, now);

        PlayerQuestionChoice selectedChoice = findSelectedChoice(
                request.getChoiceId(),
                question
        );

        boolean correct = selectedChoice.isCorrect();

        Long correctAnswerChoiceId = correct
                ? null
                : resolveCorrectAnswerChoiceId(question);

        question.setStatus(PlayerQuestionStatus.ANSWERED);
        question.setAnsweredAt(now);

        PlayerQuestion savedQuestion = playerQuestionRepository.save(question);

        return new SubmitAnswerResponse(
                savedQuestion.getId(),
                selectedChoice.getId(),
                correct,
                correctAnswerChoiceId,
                savedQuestion.getStatus().name(),
                savedQuestion.getAnsweredAt(),
                savedQuestion.getExpiresAt()
        );
    }

    private void validateInput(
            RacePlayer racePlayer,
            SubmitAnswerRequest request
    ) {
        if (racePlayer == null
                || request == null
                || request.getQuestionId() == null
                || request.getChoiceId() == null) {
            throw new ApiException(ErrorCode.INVALID_ANSWER_SUBMISSION);
        }
    }

    private PlayerQuestion findPlayerQuestion(
            Long questionId,
            RacePlayer racePlayer
    ) {
        return playerQuestionRepository.findByIdAndRacePlayer(questionId, racePlayer)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND_FOR_PLAYER));
    }

    private void validateQuestionIsActive(PlayerQuestion question) {
        if (question.getStatus() != PlayerQuestionStatus.ACTIVE) {
            throw new ApiException(ErrorCode.QUESTION_NOT_ACTIVE);
        }
    }

    private void expireQuestionIfNeeded(
            PlayerQuestion question,
            LocalDateTime now
    ) {
        if (!question.getExpiresAt().isAfter(now)) {
            question.setStatus(PlayerQuestionStatus.EXPIRED);
            playerQuestionRepository.save(question);

            throw new ApiException(ErrorCode.QUESTION_EXPIRED);
        }
    }

    private PlayerQuestionChoice findSelectedChoice(
            Long choiceId,
            PlayerQuestion question
    ) {
        return playerQuestionChoiceRepository.findByIdAndPlayerQuestion(choiceId, question)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_CHOICE_NOT_FOUND));
    }

    private Long resolveCorrectAnswerChoiceId(PlayerQuestion question) {
        List<PlayerQuestionChoice> choices =
                playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(question);

        return choices.stream()
                .filter(PlayerQuestionChoice::isCorrect)
                .map(PlayerQuestionChoice::getId)
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG));
    }
}
