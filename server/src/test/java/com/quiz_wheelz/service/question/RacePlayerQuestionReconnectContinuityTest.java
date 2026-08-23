package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerDisconnectService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import com.quiz_wheelz.service.raceplayer.RacePlayerReconnectService;
import com.quiz_wheelz.service.raceplayer.RacePlayerSessionLockService;
import com.quiz_wheelz.utils.DateTimeUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RacePlayerQuestionReconnectContinuityTest {

    private StudentQuestionDeliveryTestFixture fixture;
    private RacePlayerSessionLockService sessionLockService;
    private HttpServletRequest request;
    private RacePlayerReconnectService reconnectService;
    private RacePlayerGameplayPresenceService gameplayPresenceService;
    private RaceEngineService raceEngineService;
    private RaceMovementService raceMovementService;

    @BeforeEach
    void setUp() {
        fixture = new StudentQuestionDeliveryTestFixture();
        sessionLockService = mock(RacePlayerSessionLockService.class);
        request = mock(HttpServletRequest.class);
        gameplayPresenceService = mock(RacePlayerGameplayPresenceService.class);
        raceEngineService = mock(RaceEngineService.class);
        Clock clock = Clock.fixed(
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT,
                StudentQuestionDeliveryTestFixture.FIXED_ZONE
        );
        raceMovementService = mock(RaceMovementService.class);
        QuestionTimeoutService questionTimeoutService = new QuestionTimeoutService(
                raceMovementService,
                raceEngineService,
                fixture.playerQuestionRepository,
                clock
        );
        RacePlayerGameplayTimelineService gameplayTimelineService =
                new RacePlayerGameplayTimelineService(
                        questionTimeoutService,
                        raceMovementService,
                        clock
                );
        reconnectService = new RacePlayerReconnectService(
                sessionLockService,
                gameplayPresenceService,
                gameplayTimelineService,
                mock(RacePlayerDisconnectService.class),
                clock
        );
    }

    @Test
    void reconnectBeforeExpiryReturnsSameQuestionWithOriginalDeadline() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        LocalDateTime expiresAt = fixture.now().plusSeconds(
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS
        );
        PlayerQuestion activeQuestion = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                expiresAt
        );
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(
                activeQuestion
        );
        StudentQuestionResponse expected = fixture.createStudentQuestionResponse();

        prepareReconnect(racePlayer);
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(racePlayer));
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(activeQuestion));
        when(fixture.playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(activeQuestion))
                .thenReturn(choices);
        when(fixture.studentQuestionResponseMapper.toResponse(
                activeQuestion,
                choices,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT.toEpochMilli(),
                DateTimeUtils.toEpochMilli(
                        expiresAt,
                        StudentQuestionDeliveryTestFixture.FIXED_ZONE
                )
        )).thenReturn(expected);

        reconnectService.reconnect(request);
        StudentQuestionResponse afterReconnect = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);
        reconnectService.reconnect(request);
        StudentQuestionResponse afterReload = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);

        assertSame(expected, afterReconnect);
        assertSame(expected, afterReload);
        assertEquals(expiresAt, activeQuestion.getExpiresAt());
        verify(fixture.studentQuestionResponseMapper, times(2)).toResponse(
                activeQuestion,
                choices,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT.toEpochMilli(),
                DateTimeUtils.toEpochMilli(
                        expiresAt,
                        StudentQuestionDeliveryTestFixture.FIXED_ZONE
                )
        );
        verify(fixture.questionGenerationService, never()).generate(any());
        verify(fixture.playerQuestionPersistenceService, never())
                .persistGeneratedQuestion(any(), any());
        verify(raceMovementService, times(2)).reanchorAt(
                racePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT.toEpochMilli()
        );
        verify(gameplayPresenceService, times(2)).renewPresenceLease(
                racePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        );
    }

    @Test
    void reconnectAfterExpiryTimesOutOnceAndDoesNotGenerateInBackground() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        LocalDateTime originalExpiresAt = fixture.now().minusSeconds(1);
        PlayerQuestion expiredQuestion = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                originalExpiresAt
        );
        QuestionPlan questionPlan = fixture.createQuestionPlan();
        InternalGeneratedQuestion generatedQuestion = fixture.createGeneratedQuestion();
        PlayerQuestion nextQuestion = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                fixture.now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(nextQuestion);
        StudentQuestionResponse expected = fixture.createStudentQuestionResponse();

        prepareReconnect(racePlayer);
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenAnswer(invocation ->
                expiredQuestion.getStatus() == PlayerQuestionStatus.ACTIVE
                        ? Optional.of(expiredQuestion)
                        : Optional.empty()
        );

        reconnectService.reconnect(request);
        reconnectService.reconnect(request);

        assertEquals(PlayerQuestionStatus.EXPIRED, expiredQuestion.getStatus());
        assertEquals(originalExpiresAt, expiredQuestion.getExpiresAt());
        verify(fixture.playerQuestionRepository, times(1)).save(expiredQuestion);
        verify(raceEngineService, times(1)).applyTimeoutResult(racePlayer);
        verify(fixture.questionGenerationService, never()).generate(any());

        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(racePlayer));
        when(fixture.racePlayerQuestionPlanService.buildQuestionPlan(racePlayer))
                .thenReturn(questionPlan);
        when(fixture.questionGenerationService.generate(questionPlan))
                .thenReturn(generatedQuestion);
        when(fixture.playerQuestionPersistenceService.persistGeneratedQuestion(
                racePlayer,
                generatedQuestion
        )).thenReturn(nextQuestion);
        when(fixture.playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(nextQuestion))
                .thenReturn(choices);
        when(fixture.studentQuestionResponseMapper.toResponse(
                any(PlayerQuestion.class),
                any(),
                anyLong(),
                anyLong()
        )).thenReturn(expected);

        StudentQuestionResponse delivered = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);

        assertSame(expected, delivered);
        verify(fixture.questionGenerationService).generate(questionPlan);
        verify(fixture.playerQuestionPersistenceService).persistGeneratedQuestion(
                racePlayer,
                generatedQuestion
        );
    }

    private void prepareReconnect(RacePlayer racePlayer) {
        when(sessionLockService.resolveAndLock(request)).thenReturn(racePlayer);
        when(gameplayPresenceService.resolve(
                racePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        )).thenReturn(presenceDecision());
    }

    private GameplayPresenceDecision presenceDecision() {
        return new GameplayPresenceDecision(
                true,
                false,
                false,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT.toEpochMilli()
        );
    }
}
