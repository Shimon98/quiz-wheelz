package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.StudentAnswerRaceImpactResponse;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayRequestGuard;
import com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotMapper;
import com.quiz_wheelz.service.raceplayer.StudentRaceStandingResult;
import com.quiz_wheelz.service.raceplayer.StudentRaceStandingService;
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
    private final RacePlayerGameplayRequestGuard gameplayRequestGuard;
    private final StudentRaceStandingService standingService;
    private final StudentRaceRuntimeSnapshotMapper snapshotMapper;
    private final RaceLiveEventRecorder liveEventRecorder;
    private final RaceLiveEventChangeRecorder liveEventChangeRecorder;
    private final RaceLiveMutationGate liveMutationGate;
    private final Clock clock;

    public StudentAnswerSubmissionService(
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            RacePlayerRepository racePlayerRepository,
            RaceEngineService raceEngineService,
            RacePlayerGameplayRequestGuard gameplayRequestGuard,
            StudentRaceStandingService standingService,
            StudentRaceRuntimeSnapshotMapper snapshotMapper,
            RaceLiveEventRecorder liveEventRecorder,
            RaceLiveEventChangeRecorder liveEventChangeRecorder,
            RaceLiveMutationGate liveMutationGate,
            Clock clock
    ) {
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.raceEngineService = Objects.requireNonNull(raceEngineService);
        this.gameplayRequestGuard = Objects.requireNonNull(gameplayRequestGuard);
        this.standingService = Objects.requireNonNull(standingService);
        this.snapshotMapper = Objects.requireNonNull(snapshotMapper);
        this.liveEventRecorder = Objects.requireNonNull(liveEventRecorder);
        this.liveEventChangeRecorder = Objects.requireNonNull(liveEventChangeRecorder);
        this.liveMutationGate = Objects.requireNonNull(liveMutationGate);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public SubmitAnswerResponse submitAnswer(
            RacePlayer racePlayer,
            SubmitAnswerRequest request
    ) {
        validateInput(racePlayer, request);

        RacePlayer lockedRacePlayer = findLockedRacePlayer(racePlayer);
        Race activeRace = liveMutationGate.lockIfActive(lockedRacePlayer).orElse(null);
        PlayerLiveState playerBefore = activeRace == null
                ? null
                : liveEventChangeRecorder.capturePlayer(lockedRacePlayer);
        RaceLiveState raceBefore = activeRace == null
                ? null
                : liveEventChangeRecorder.captureRace(activeRace);

        try {
            return submitLockedAnswer(
                    lockedRacePlayer,
                    request,
                    activeRace,
                    playerBefore,
                    raceBefore
            );
        } catch (ApiException exception) {
            recordLiveChanges(
                    activeRace,
                    playerBefore,
                    raceBefore,
                    lockedRacePlayer
            );
            throw exception;
        }
    }

    private SubmitAnswerResponse submitLockedAnswer(
            RacePlayer lockedRacePlayer,
            SubmitAnswerRequest request,
            Race activeRace,
            PlayerLiveState playerBefore,
            RaceLiveState raceBefore
    ) {

        Instant decisionInstant = clock.instant();
        LocalDateTime now = DateTimeUtils.toLocalDateTime(decisionInstant, clock.getZone());
        long decisionEpochMs = decisionInstant.toEpochMilli();

        PlayerQuestion question = findLockedPlayerQuestion(
                request.getQuestionId(),
                lockedRacePlayer
        );

        validateQuestionIsActive(question);

        gameplayRequestGuard.requireGameplayAccess(
                lockedRacePlayer,
                decisionInstant
        );

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

        StudentRaceStandingResult standing = standingService.calculate(lockedRacePlayer);

        StudentRaceRuntimeSnapshotResponse snapshot =
                snapshotMapper.fromAnswerRaceImpact(
                        answerRaceImpact,
                        lockedRacePlayer.getRace(),
                        standing,
                        decisionEpochMs
                );

        question.setStatus(PlayerQuestionStatus.ANSWERED);
        question.setAnsweredAt(now);

        PlayerQuestion savedQuestion = playerQuestionRepository.save(question);

        if (activeRace != null) {
            liveEventRecorder.recordQuestionAnswered(
                    lockedRacePlayer,
                    savedQuestion.getId(),
                    correct
            );
        }
        recordLiveChanges(
                activeRace,
                playerBefore,
                raceBefore,
                lockedRacePlayer
        );

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

    private void recordLiveChanges(
            Race activeRace,
            PlayerLiveState playerBefore,
            RaceLiveState raceBefore,
            RacePlayer racePlayer
    ) {
        if (activeRace == null) {
            return;
        }
        liveEventChangeRecorder.recordPlayerChange(playerBefore, racePlayer);
        liveEventChangeRecorder.recordRaceChange(raceBefore, activeRace);
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
