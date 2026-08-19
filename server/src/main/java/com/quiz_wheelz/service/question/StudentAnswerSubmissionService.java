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
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotMapper;
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
    private final RaceMovementService raceMovementService;
    private final QuestionTimeoutService questionTimeoutService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;
    private final Clock clock;

    // Shared application Clock (TimeConfig) — injected, never self-created.
    public StudentAnswerSubmissionService(
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            RacePlayerRepository racePlayerRepository,
            RaceEngineService raceEngineService,
            RaceMovementService raceMovementService,
            QuestionTimeoutService questionTimeoutService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            Clock clock
    ) {
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.raceEngineService = Objects.requireNonNull(raceEngineService);
        this.raceMovementService = Objects.requireNonNull(raceMovementService);
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.clock = Objects.requireNonNull(clock);
    }

    // noRollbackFor is deliberate for the timeout path too: a late answer's
    // QUESTION_EXPIRED must still COMMIT the settled movement, the EXPIRED
    // transition and the timeout penalty.
    @Transactional(noRollbackFor = ApiException.class)
    public SubmitAnswerResponse submitAnswer(
            RacePlayer racePlayer,
            SubmitAnswerRequest request
    ) {
        validateInput(racePlayer, request);

        RacePlayer lockedRacePlayer = findLockedRacePlayer(racePlayer);

        // ONE decision instant: expiry, answeredAt, movement settlement and
        // the snapshot timestamp all describe the same moment.
        Instant decisionInstant = clock.instant();
        LocalDateTime now = DateTimeUtils.toLocalDateTime(decisionInstant, clock.getZone());
        long decisionEpochMs = decisionInstant.toEpochMilli();

        PlayerQuestion question = findLockedPlayerQuestion(
                request.getQuestionId(),
                lockedRacePlayer
        );

        validateQuestionIsActive(question);

        if (DateTimeUtils.isExpired(question.getExpiresAt(), now)) {
            // Timeout is a gameplay event with ONE owner — it settles the
            // pre/post-deadline intervals at the right speeds and penalizes
            // exactly once.
            questionTimeoutService.processExpiredActiveQuestion(
                    lockedRacePlayer,
                    question,
                    decisionEpochMs
            );

            throw new ApiException(ErrorCode.QUESTION_EXPIRED);
        }

        // The elapsed interval up to this answer belongs to the OLD speed —
        // settle it before any boost/penalty may change the speed.
        boolean finishedByMovement =
                raceMovementService.settleTo(lockedRacePlayer, decisionEpochMs);

        if (finishedByMovement) {
            // Finish wins chronologically: the player crossed the line before
            // the answer was applied, so no answer impact after the finish.
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

        // Public timing contract is absolute epoch ms — the durable
        // LocalDateTime stays internal, converted with the shared Clock zone.
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
