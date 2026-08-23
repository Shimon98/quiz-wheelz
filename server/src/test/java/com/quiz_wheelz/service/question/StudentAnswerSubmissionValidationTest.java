package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentAnswerSubmissionValidationTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 7L;
    private static final long QUESTION_ID = 10L;
    private static final long CORRECT_CHOICE_ID = 101L;
    private static final long WRONG_CHOICE_ID = 102L;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Mock
    private PlayerQuestionChoiceRepository playerQuestionChoiceRepository;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RaceEngineService raceEngineService;

    @Mock
    private RaceMovementService raceMovementService;

    @Mock
    private QuestionTimeoutService questionTimeoutService;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    private StudentAnswerSubmissionService studentAnswerSubmissionService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);

        studentAnswerSubmissionService = new StudentAnswerSubmissionService(
                playerQuestionRepository,
                playerQuestionChoiceRepository,
                racePlayerRepository,
                raceEngineService,
                gameplayPresenceService,
                gameplayTimelineService,
                new StudentRaceRuntimeSnapshotMapper(),
                fixedClock
        );
    }

    @Test
    void shouldRejectMissingRacePlayer() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        null,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectMissingRequest() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(createRacePlayer(), null)
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectMissingQuestionId() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        createRacePlayer(),
                        createRequest(null, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectMissingChoiceId() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        createRacePlayer(),
                        createRequest(QUESTION_ID, null)
                )
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectRacePlayerWithoutIdentity() {
        RacePlayer racePlayer = new RacePlayer();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.INVALID_ANSWER_SUBMISSION, exception.getErrorCode());
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectRacePlayerThatCannotBeLocked() {
        RacePlayer racePlayer = createRacePlayer();

        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, exception.getErrorCode());

        verify(playerQuestionRepository, never())
                .findLockedByIdAndRacePlayer(any(), any());
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectQuestionThatDoesNotBelongToPlayer() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer = mockLockedRacePlayer(racePlayer);

        when(playerQuestionRepository.findLockedByIdAndRacePlayer(QUESTION_ID, lockedRacePlayer))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_NOT_FOUND_FOR_PLAYER, exception.getErrorCode());
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectQuestionThatIsNotActive() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer = mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = createQuestion(PlayerQuestionStatus.ANSWERED, now().plusSeconds(30));

        when(playerQuestionRepository.findLockedByIdAndRacePlayer(QUESTION_ID, lockedRacePlayer))
                .thenReturn(Optional.of(question));
        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, CORRECT_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_NOT_ACTIVE, exception.getErrorCode());
        verify(playerQuestionChoiceRepository, never())
                .findByIdAndPlayerQuestion(CORRECT_CHOICE_ID, question);
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }

    @Test
    void shouldRejectChoiceThatDoesNotBelongToQuestion() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer = mockLockedRacePlayer(racePlayer);
        PlayerQuestion question = createActiveQuestion(now().plusSeconds(30));

        when(playerQuestionRepository.findLockedByIdAndRacePlayer(QUESTION_ID, lockedRacePlayer))
                .thenReturn(Optional.of(question));
        when(playerQuestionChoiceRepository.findByIdAndPlayerQuestion(WRONG_CHOICE_ID, question))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        createRequest(QUESTION_ID, WRONG_CHOICE_ID)
                )
        );

        assertEquals(ErrorCode.QUESTION_CHOICE_NOT_FOUND, exception.getErrorCode());
        verify(playerQuestionRepository, never()).save(question);
        verify(raceEngineService, never()).applyAnswerResult(any(), anyBoolean());
    }


    private SubmitAnswerRequest createRequest(Long questionId, Long choiceId) {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setChoiceId(choiceId);

        return request;
    }

    private RacePlayer createRacePlayer() {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);
        racePlayer.setPosition(0.0);
        racePlayer.setSpeed(1.0);
        racePlayer.setScore(0);
        racePlayer.setStreak(0);
        racePlayer.setHighestStreak(0);
        racePlayer.setCorrectAnswers(0);
        racePlayer.setWrongAnswers(0);
        racePlayer.setDifficultyCorrectStreak(0);
        racePlayer.setDifficultyWrongStreak(0);

        return racePlayer;
    }

    private RacePlayer mockLockedRacePlayer(RacePlayer requestRacePlayer) {
        RacePlayer lockedRacePlayer = createRacePlayer();

        when(racePlayerRepository.findLockedByIdAndRaceId(
                requestRacePlayer.getId(),
                requestRacePlayer.getRace().getId()
        )).thenReturn(Optional.of(lockedRacePlayer));

        return lockedRacePlayer;
    }

    private AnswerRaceImpact createRaceImpact(
            RacePlayer racePlayer,
            boolean correct
    ) {
        return new AnswerRaceImpact(
                RACE_ID,
                RACE_PLAYER_ID,
                correct,
                correct ? 10 : 0,
                correct ? 10.0 : 0.0,
                correct ? 10 : 0,
                correct ? 10.0 : 0.0,
                correct ? 1.2 : 0.8,
                correct ? 1 : 0,
                correct ? 1 : 0,
                correct ? 1 : 0,
                correct ? 0 : 1,
                Difficulty.EASY,
                racePlayer.getCurrentDifficulty(),
                racePlayer.getDifficultyCorrectStreak(),
                racePlayer.getDifficultyWrongStreak(),
                false,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS,
                false,
                false
        );
    }

    private PlayerQuestion createActiveQuestion(LocalDateTime expiresAt) {
        return createQuestion(PlayerQuestionStatus.ACTIVE, expiresAt);
    }

    private PlayerQuestion createQuestion(
            PlayerQuestionStatus status,
            LocalDateTime expiresAt
    ) {
        PlayerQuestion question = new PlayerQuestion();
        question.setId(QUESTION_ID);
        question.setStatus(status);
        question.setExpiresAt(expiresAt);

        return question;
    }

    private PlayerQuestionChoice createChoice(
            Long choiceId,
            boolean correct,
            PlayerQuestion question
    ) {
        PlayerQuestionChoice choice = new PlayerQuestionChoice();
        choice.setId(choiceId);
        choice.setPlayerQuestion(question);
        choice.setCorrect(correct);

        return choice;
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }

    private long epochOf(LocalDateTime localDateTime) {
        return localDateTime.atZone(FIXED_ZONE).toInstant().toEpochMilli();
    }
}


