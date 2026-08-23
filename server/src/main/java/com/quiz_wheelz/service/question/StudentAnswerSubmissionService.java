package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.StudentAnswerRaceImpactResponse;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotMapper;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class StudentAnswerSubmissionService {

    private final PlayerQuestionRepository playerQuestionRepository;
    private final PlayerQuestionChoiceRepository playerQuestionChoiceRepository;
    private final RacePlayerRepository racePlayerRepository;
    private final RaceEngineService raceEngineService;
    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;
    private final Clock clock;

    public StudentAnswerSubmissionService(
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            RacePlayerRepository racePlayerRepository,
            RaceEngineService raceEngineService,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            Clock clock
    ) {
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.raceEngineService = Objects.requireNonNull(raceEngineService);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public SubmitAnswerResponse submitAnswer(
            RacePlayer racePlayer,
            SubmitAnswerRequest request
    ) {
        validateInput(racePlayer, request);

        RacePlayer lockedRacePlayer = findLockedRacePlayer(racePlayer);

        Instant decisionInstant = clock.instant();
        LocalDateTime now = DateTimeUtils.toLocalDateTime(decisionInstant, clock.getZone());
        long decisionEpochMs = decisionInstant.toEpochMilli();

        PlayerQuestion question = findLockedPlayerQuestion(
                request.getQuestionId(),
                lockedRacePlayer
        );

        validateQuestionIsActive(question);

        RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                gameplayPresenceService.resolve(lockedRacePlayer, decisionInstant);
        boolean disconnected = gameplayTimelineService.settlePlayerActivity(
                lockedRacePlayer,
                decisionInstant,
                presenceDecision
        );
        if (disconnected) {
            gameplayPresenceService.markOffline(lockedRacePlayer);
        } else {
            gameplayPresenceService.recordPlayerActivity(
                    lockedRacePlayer,
                    decisionInstant
            );
        }

        if (question.getStatus() == PlayerQuestionStatus.EXPIRED) {
            throw new ApiException(ErrorCode.QUESTION_EXPIRED);
        }

        if (lockedRacePlayer.getStatus() != RacePlayerStatus.RACING) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_RACING);
        }

        PlayerQuestionChoice selectedChoice = findSelectedChoice(
                request.getChoiceId(),
                question
        );

        boolean correct = selectedChoice.isCorrect();

        Long correctAnswerChoiceId = correct
                ? null
                : resolveCorrectAnswerChoiceId(question);

        AnswerRaceImpact answerRaceImpact =
                raceEngineService.applyAnswerResult(lockedRacePlayer, correct);

        StudentRaceRuntimeSnapshotResponse snapshot =
                snapshotMapper.fromAnswerRaceImpact(
                        answerRaceImpact,
                        lockedRacePlayer.getRace(),
                        decisionEpochMs
                );

        question.setStatus(PlayerQuestionStatus.ANSWERED);
        question.setAnsweredAt(now);

        PlayerQuestion savedQuestion = playerQuestionRepository.save(question);

        return new SubmitAnswerResponse(
                savedQuestion.getId(),
                selectedChoice.getId(),
                correct,
                correctAnswerChoiceId,
                savedQuestion.getStatus().name(),
                DateTimeUtils.toEpochMilli(savedQuestion.getAnsweredAt(), clock.getZone()),
                DateTimeUtils.toEpochMilli(savedQuestion.getExpiresAt(), clock.getZone()),
                StudentAnswerRaceImpactResponse.from(answerRaceImpact, snapshot)
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

    private RacePlayer findLockedRacePlayer(RacePlayer racePlayer) {
        validateRacePlayerIdentity(racePlayer);

        return racePlayerRepository
                .findLockedByIdAndRaceId(
                        racePlayer.getId(),
                        racePlayer.getRace().getId()
                )
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
    }

    private void validateRacePlayerIdentity(RacePlayer racePlayer) {
        if (racePlayer.getId() == null
                || racePlayer.getRace() == null
                || racePlayer.getRace().getId() == null) {
            throw new ApiException(ErrorCode.INVALID_ANSWER_SUBMISSION);
        }
    }

    private PlayerQuestion findLockedPlayerQuestion(
            Long questionId,
            RacePlayer racePlayer
    ) {
        return playerQuestionRepository.findLockedByIdAndRacePlayer(questionId, racePlayer)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND_FOR_PLAYER));
    }

    private void validateQuestionIsActive(PlayerQuestion question) {
        if (question.getStatus() != PlayerQuestionStatus.ACTIVE) {
            throw new ApiException(ErrorCode.QUESTION_NOT_ACTIVE);
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
