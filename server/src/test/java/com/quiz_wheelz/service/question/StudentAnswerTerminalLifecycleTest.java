package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
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
import com.quiz_wheelz.service.raceengine.DifficultyProgressionService;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceengine.RaceProgressService;
import com.quiz_wheelz.service.raceengine.ScoringService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayRequestGuard;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import com.quiz_wheelz.service.raceplayer.StudentRaceRuntimeSnapshotMapper;
import com.quiz_wheelz.service.raceplayer.StudentRaceStandingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentAnswerTerminalLifecycleTest {

    private static final Instant NOW = Instant.parse("2026-08-23T12:00:00Z");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 7L;
    private static final long QUESTION_ID = 10L;
    private static final long CHOICE_ID = 101L;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Mock
    private PlayerQuestionChoiceRepository playerQuestionChoiceRepository;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    @Mock
    private ScoringService scoringService;

    @Mock
    private RaceProgressService raceProgressService;

    @Mock
    private DifficultyProgressionService difficultyProgressionService;

    @Mock
    private RaceFinishService raceFinishService;

    private StudentRaceStandingService standingService;
    private StudentAnswerSubmissionService answerService;

    @BeforeEach
    void setUp() {
        RacePlayerGameplayRequestGuard requestGuard =
                new RacePlayerGameplayRequestGuard(
                        gameplayPresenceService,
                        gameplayTimelineService,
                        racePlayerRepository
                );
        RaceEngineService raceEngineService = new RaceEngineService(
                scoringService,
                raceProgressService,
                difficultyProgressionService,
                raceFinishService
        );
        standingService = new StudentRaceStandingService(
                racePlayerRepository,
                new RaceStandingCalculator()
        );
        answerService = new StudentAnswerSubmissionService(
                playerQuestionRepository,
                playerQuestionChoiceRepository,
                racePlayerRepository,
                raceEngineService,
                requestGuard,
                standingService,
                new StudentRaceRuntimeSnapshotMapper(),
                mock(com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder.class),
                new com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker(
                        mock(com.quiz_wheelz.service.liveevent.RaceLiveMutationGate.class),
                        mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class)
                ),
                Clock.fixed(NOW, ZoneId.of("UTC"))
        );
    }

    @Test
    void disconnectedPlayerAnswerCannotApplyAnyEngineEffect() {
        assertTerminalPlayerRejectedWithoutEngineEffects(RacePlayerStatus.DISCONNECTED);
    }

    @Test
    void finishedPlayerAnswerCannotApplyAnyEngineEffect() {
        assertTerminalPlayerRejectedWithoutEngineEffects(RacePlayerStatus.FINISHED);
    }

    @Test
    void finishedRaceAnswerCannotApplyAnyEngineEffect() {
        RacePlayer racePlayer = prepareLockedPlayer(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );
        PlayerQuestion question = prepareActiveQuestion(racePlayer);
        PlayerQuestionChoice selectedChoice = new PlayerQuestionChoice();
        selectedChoice.setId(CHOICE_ID);
        selectedChoice.setPlayerQuestion(question);
        selectedChoice.setCorrect(true);
        when(playerQuestionChoiceRepository.findByIdAndPlayerQuestion(
                CHOICE_ID,
                question
        )).thenReturn(Optional.of(selectedChoice));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerService.submitAnswer(racePlayer, request())
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
        assertUnchanged(racePlayer, question);
        verifyNoEnginePolicyEffects();
        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
        verify(playerQuestionRepository, never()).save(any());
        verify(racePlayerRepository, never()).findByRaceOrderByLaneNumberAsc(any());
    }

    private void assertTerminalPlayerRejectedWithoutEngineEffects(
            RacePlayerStatus playerStatus
    ) {
        RacePlayer racePlayer = prepareLockedPlayer(
                playerStatus,
                RaceStatus.IN_PROGRESS
        );
        PlayerQuestion question = prepareActiveQuestion(racePlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> answerService.submitAnswer(racePlayer, request())
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
        assertUnchanged(racePlayer, question);
        verifyNoEnginePolicyEffects();
        verifyNoInteractions(
                gameplayPresenceService,
                gameplayTimelineService,
                playerQuestionChoiceRepository
        );
        verify(playerQuestionRepository, never()).save(any());
        verify(racePlayerRepository, never()).findByRaceOrderByLaneNumberAsc(any());
    }

    private RacePlayer prepareLockedPlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);
        race.setTotalDistance(1000);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);
        racePlayer.setScore(50);
        racePlayer.setPosition(120.0);
        racePlayer.setSpeed(1.2);
        racePlayer.setStreak(3);
        racePlayer.setHighestStreak(5);
        racePlayer.setCorrectAnswers(4);
        racePlayer.setWrongAnswers(2);
        racePlayer.setDifficultyCorrectStreak(1);
        racePlayer.setDifficultyWrongStreak(0);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));
        return racePlayer;
    }

    private PlayerQuestion prepareActiveQuestion(RacePlayer racePlayer) {
        PlayerQuestion question = new PlayerQuestion();
        question.setId(QUESTION_ID);
        question.setStatus(PlayerQuestionStatus.ACTIVE);
        question.setExpiresAt(LocalDateTime.ofInstant(NOW.plusSeconds(30), ZoneId.of("UTC")));
        when(playerQuestionRepository.findLockedByIdAndRacePlayer(
                QUESTION_ID,
                racePlayer
        )).thenReturn(Optional.of(question));
        return question;
    }

    private SubmitAnswerRequest request() {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(QUESTION_ID);
        request.setChoiceId(CHOICE_ID);
        return request;
    }

    private void assertUnchanged(RacePlayer racePlayer, PlayerQuestion question) {
        assertEquals(50, racePlayer.getScore());
        assertEquals(120.0, racePlayer.getPosition());
        assertEquals(1.2, racePlayer.getSpeed());
        assertEquals(3, racePlayer.getStreak());
        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        assertNull(question.getAnsweredAt());
    }

    private void verifyNoEnginePolicyEffects() {
        verifyNoInteractions(
                scoringService,
                raceProgressService,
                difficultyProgressionService,
                raceFinishService
        );
    }
}
