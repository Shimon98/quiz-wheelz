package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestionChoice;
import com.quiz_wheelz.dto.question.student.StudentQuestionChoiceResponse;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentQuestionDeliveryGenerationTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long RACE_ID = 3L;
    private static final long RACE_PLAYER_ID = 17L;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private PlayerQuestionRepository playerQuestionRepository;

    @Mock
    private PlayerQuestionChoiceRepository playerQuestionChoiceRepository;

    @Mock
    private RacePlayerQuestionPlanService racePlayerQuestionPlanService;

    @Mock
    private QuestionGenerationService questionGenerationService;

    @Mock
    private PlayerQuestionPersistenceService playerQuestionPersistenceService;

    @Mock
    private StudentQuestionResponseMapper studentQuestionResponseMapper;

    @Mock
    private RaceMovementService raceMovementService;

    @Mock
    private QuestionTimeoutService questionTimeoutService;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    private StudentQuestionDeliveryService studentQuestionDeliveryService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);

        studentQuestionDeliveryService = new StudentQuestionDeliveryService(
                racePlayerRepository,
                playerQuestionRepository,
                playerQuestionChoiceRepository,
                racePlayerQuestionPlanService,
                questionGenerationService,
                playerQuestionPersistenceService,
                studentQuestionResponseMapper,
                gameplayPresenceService,
                gameplayTimelineService,
                fixedClock
        );
    }

    @Test
    void shouldGenerateAndPersistQuestionWhenNoActiveQuestionExists() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer = createRacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion();
        PlayerQuestion persistedQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = createPlayerQuestionChoices(persistedQuestion);
        StudentQuestionResponse expectedResponse = createStudentQuestionResponse();

        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                lockedRacePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.empty());
        when(racePlayerQuestionPlanService.buildQuestionPlan(lockedRacePlayer))
                .thenReturn(questionPlan);
        when(questionGenerationService.generate(questionPlan)).thenReturn(generatedQuestion);
        when(playerQuestionPersistenceService.persistGeneratedQuestion(lockedRacePlayer, generatedQuestion))
                .thenReturn(persistedQuestion);
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(persistedQuestion))
                .thenReturn(choices);
        when(studentQuestionResponseMapper.toResponse(
                eq(persistedQuestion),
                eq(choices),
                anyLong(),
                anyLong()
        )).thenReturn(expectedResponse);

        StudentQuestionResponse result =
                studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer);

        assertSame(expectedResponse, result);

        InOrder planAfterLock = inOrder(racePlayerRepository, racePlayerQuestionPlanService);
        planAfterLock.verify(racePlayerRepository)
                .findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        planAfterLock.verify(racePlayerQuestionPlanService)
                .buildQuestionPlan(lockedRacePlayer);

        verify(questionGenerationService).generate(questionPlan);
        verify(playerQuestionPersistenceService)
                .persistGeneratedQuestion(lockedRacePlayer, generatedQuestion);
    }

    @Test
    void shouldExpireExistingQuestionAndGenerateNewOneWhenQuestionExpired() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer = createRacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        PlayerQuestion expiredActiveQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().minusSeconds(1)
        );
        InternalGeneratedQuestion generatedQuestion = createGeneratedQuestion();
        PlayerQuestion persistedQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = createPlayerQuestionChoices(persistedQuestion);
        StudentQuestionResponse expectedResponse = createStudentQuestionResponse();

        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                lockedRacePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.empty());
        doAnswer(invocation -> {
            expiredActiveQuestion.setStatus(PlayerQuestionStatus.EXPIRED);
            return false;
        }).when(gameplayTimelineService).settlePlayerActivity(
                any(),
                any(),
                any()
        );
        when(racePlayerQuestionPlanService.buildQuestionPlan(lockedRacePlayer))
                .thenReturn(questionPlan);
        when(questionGenerationService.generate(questionPlan)).thenReturn(generatedQuestion);
        when(playerQuestionPersistenceService.persistGeneratedQuestion(lockedRacePlayer, generatedQuestion))
                .thenReturn(persistedQuestion);
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(persistedQuestion))
                .thenReturn(choices);
        when(studentQuestionResponseMapper.toResponse(
                eq(persistedQuestion),
                eq(choices),
                anyLong(),
                anyLong()
        )).thenReturn(expectedResponse);

        StudentQuestionResponse result =
                studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer);

        assertSame(expectedResponse, result);

        verify(gameplayTimelineService).settlePlayerActivity(
                lockedRacePlayer,
                FIXED_INSTANT,
                null
        );
        verify(questionGenerationService).generate(questionPlan);
        verify(playerQuestionPersistenceService)
                .persistGeneratedQuestion(lockedRacePlayer, generatedQuestion);
    }

    @Test
    void shouldTreatQuestionExpiringNowAsExpired() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer = createRacePlayer();
        PlayerQuestion activeQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now()
        );
        PlayerQuestion persistedQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );

        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                lockedRacePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.empty());
        doAnswer(invocation -> {
            activeQuestion.setStatus(PlayerQuestionStatus.EXPIRED);
            return false;
        }).when(gameplayTimelineService).settlePlayerActivity(
                any(),
                any(),
                any()
        );
        when(racePlayerQuestionPlanService.buildQuestionPlan(lockedRacePlayer))
                .thenReturn(createQuestionPlan());
        when(questionGenerationService.generate(any(QuestionPlan.class)))
                .thenReturn(createGeneratedQuestion());
        when(playerQuestionPersistenceService.persistGeneratedQuestion(any(), any()))
                .thenReturn(persistedQuestion);
        when(playerQuestionChoiceRepository.findByPlayerQuestionOrderByDisplayOrderAsc(persistedQuestion))
                .thenReturn(createPlayerQuestionChoices(persistedQuestion));
        when(studentQuestionResponseMapper.toResponse(any(), any(), anyLong(), anyLong()))
                .thenReturn(createStudentQuestionResponse());

        studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer);

        verify(gameplayTimelineService).settlePlayerActivity(
                lockedRacePlayer,
                FIXED_INSTANT,
                null
        );
    }

    @Test
    void shouldRejectLockedPlayerThatFinishedWhileWaitingForTheLock() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer =
                createRacePlayer(RacePlayerStatus.FINISHED, RaceStatus.IN_PROGRESS);

        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());

        verify(racePlayerQuestionPlanService, never()).buildQuestionPlan(any());
        verify(questionGenerationService, never()).generate(any(QuestionPlan.class));
        verify(playerQuestionPersistenceService, never()).persistGeneratedQuestion(any(), any());
        verify(studentQuestionResponseMapper, never())
                .toResponse(any(), any(), anyLong(), anyLong());
    }

    @Test
    void shouldRejectLockedPlayerWhoseRaceEndedWhileWaitingForTheLock() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer =
                createRacePlayer(RacePlayerStatus.RACING, RaceStatus.FINISHED);

        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer)
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());

        verify(racePlayerQuestionPlanService, never()).buildQuestionPlan(any());
        verify(questionGenerationService, never()).generate(any(QuestionPlan.class));
        verify(playerQuestionPersistenceService, never()).persistGeneratedQuestion(any(), any());
        verify(studentQuestionResponseMapper, never())
                .toResponse(any(), any(), anyLong(), anyLong());
    }

    @Test
    void shouldRejectExistingActiveQuestionWithoutExpiresAt() {
        RacePlayer racePlayer = createRacePlayer();
        RacePlayer lockedRacePlayer = createRacePlayer();
        PlayerQuestion activeQuestion = createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                null
        );

        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(playerQuestionRepository.findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                lockedRacePlayer,
                PlayerQuestionStatus.ACTIVE
        )).thenReturn(Optional.of(activeQuestion));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }


    private RacePlayer createRacePlayer() {
        return createRacePlayer(RacePlayerStatus.RACING, RaceStatus.IN_PROGRESS);
    }

    private RacePlayer createRacePlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);

        return racePlayer;
    }

    private QuestionPlan createQuestionPlan() {
        return new QuestionPlan(
                createMathSubject(),
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                10,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                QuestionRules.DEFAULT_CHOICES_COUNT,
                QuestionGenerationPattern.BINARY_OPERATION,
                AdaptiveMode.BASIC,
                AssistanceLevel.NONE
        );
    }

    private InternalGeneratedQuestion createGeneratedQuestion() {
        return new InternalGeneratedQuestion(
                createMathSubject(),
                new QuestionTemplate(),
                QuestionType.ADDITION,
                Difficulty.EASY,
                "6 + 6 = ?",
                12,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                List.of(
                        new InternalGeneratedQuestionChoice("12", 12, true, 1),
                        new InternalGeneratedQuestionChoice("10", 10, false, 2),
                        new InternalGeneratedQuestionChoice("14", 14, false, 3),
                        new InternalGeneratedQuestionChoice("15", 15, false, 4)
                )
        );
    }

    private PlayerQuestion createPlayerQuestion(
            PlayerQuestionStatus status,
            LocalDateTime expiresAt
    ) {
        PlayerQuestion playerQuestion = new PlayerQuestion();
        playerQuestion.setQuestionTemplate(new QuestionTemplate());
        playerQuestion.setQuestionText("6 + 6 = ?");
        playerQuestion.setCorrectAnswerValue(12);
        playerQuestion.setTimeLimitSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS);
        playerQuestion.setStatus(status);
        playerQuestion.setExpiresAt(expiresAt);

        return playerQuestion;
    }

    private List<PlayerQuestionChoice> createPlayerQuestionChoices(
            PlayerQuestion playerQuestion
    ) {
        PlayerQuestionChoice firstChoice = createPlayerQuestionChoice(
                playerQuestion,
                "12",
                12,
                true,
                1
        );
        PlayerQuestionChoice secondChoice = createPlayerQuestionChoice(
                playerQuestion,
                "10",
                10,
                false,
                2
        );

        return List.of(firstChoice, secondChoice);
    }

    private PlayerQuestionChoice createPlayerQuestionChoice(
            PlayerQuestion playerQuestion,
            String choiceText,
            Integer answerValue,
            boolean correct,
            Integer displayOrder
    ) {
        PlayerQuestionChoice choice = new PlayerQuestionChoice();
        choice.setPlayerQuestion(playerQuestion);
        choice.setChoiceText(choiceText);
        choice.setAnswerValue(answerValue);
        choice.setCorrect(correct);
        choice.setDisplayOrder(displayOrder);

        return choice;
    }

    private StudentQuestionResponse createStudentQuestionResponse() {
        return new StudentQuestionResponse(
                1L,
                "6 + 6 = ?",
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                FIXED_INSTANT.toEpochMilli(),
                FIXED_INSTANT.plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS).toEpochMilli(),
                List.of(
                        new StudentQuestionChoiceResponse(1L, "12", 1),
                        new StudentQuestionChoiceResponse(2L, "10", 2)
                )
        );
    }

    private Subject createMathSubject() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);

        return subject;
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }
}


