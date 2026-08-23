package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayRequestGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentQuestionReloadHardeningTest {

    private static final long EXPIRED_QUESTION_ID = 41L;
    private static final long CURRENT_QUESTION_ID = 42L;

    private StudentQuestionDeliveryTestFixture fixture;
    private RacePlayerGameplayPresenceService gameplayPresenceService;
    private RaceMovementService raceMovementService;
    private RaceEngineService raceEngineService;
    private StudentQuestionDeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        fixture = new StudentQuestionDeliveryTestFixture();
        gameplayPresenceService = mock(RacePlayerGameplayPresenceService.class);
        raceMovementService = mock(RaceMovementService.class);
        raceEngineService = mock(RaceEngineService.class);
        Clock clock = Clock.fixed(
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT,
                StudentQuestionDeliveryTestFixture.FIXED_ZONE
        );
        QuestionTimeoutService timeoutService = new QuestionTimeoutService(
                raceMovementService,
                raceEngineService,
                fixture.playerQuestionRepository,
                clock
        );
        RacePlayerGameplayTimelineService timelineService =
                new RacePlayerGameplayTimelineService(
                        timeoutService,
                        raceMovementService,
                        clock
                );
        RacePlayerGameplayRequestGuard requestGuard =
                new RacePlayerGameplayRequestGuard(
                        gameplayPresenceService,
                        timelineService,
                        fixture.racePlayerRepository
                );
        deliveryService = new StudentQuestionDeliveryService(
                fixture.racePlayerRepository,
                fixture.playerQuestionRepository,
                fixture.playerQuestionChoiceRepository,
                fixture.racePlayerQuestionPlanService,
                fixture.questionGenerationService,
                fixture.playerQuestionPersistenceService,
                new StudentQuestionResponseMapper(),
                requestGuard,
                clock
        );
    }

    @Test
    void reloadAfterExpiryTimesOutOnceThenReturnsSameCurrentQuestionAndDeadline() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        LocalDateTime expiredAt = fixture.now().minusSeconds(1);
        LocalDateTime currentExpiresAt = fixture.now().plusSeconds(30);
        PlayerQuestion expired = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                expiredAt
        );
        expired.setId(EXPIRED_QUESTION_ID);
        PlayerQuestion current = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                currentExpiresAt
        );
        current.setId(CURRENT_QUESTION_ID);
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(current);
        choices.get(0).setId(101L);
        choices.get(1).setId(102L);

        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(racePlayer));
        RacePlayerGameplayPresenceService.GameplayPresenceDecision online =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        true,
                        false,
                        StudentQuestionDeliveryTestFixture.FIXED_INSTANT.toEpochMilli()
                );
        when(gameplayPresenceService.resolve(
                racePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        )).thenReturn(online);
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(expired))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(current))
                .thenReturn(Optional.of(current));
        when(fixture.racePlayerQuestionPlanService.buildQuestionPlan(racePlayer))
                .thenReturn(fixture.createQuestionPlan());
        when(fixture.questionGenerationService.generate(any()))
                .thenReturn(fixture.createGeneratedQuestion());
        when(fixture.playerQuestionPersistenceService.persistGeneratedQuestion(
                eq(racePlayer),
                any()
        )).thenReturn(current);
        when(fixture.playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(current))
                .thenReturn(choices);

        StudentQuestionResponse first = deliveryService.getOrCreateCurrentQuestion(racePlayer);
        StudentQuestionResponse second = deliveryService.getOrCreateCurrentQuestion(racePlayer);

        assertEquals(CURRENT_QUESTION_ID, first.getQuestionId());
        assertEquals(CURRENT_QUESTION_ID, second.getQuestionId());
        assertEquals(first.getExpiresAtEpochMs(), second.getExpiresAtEpochMs());
        assertEquals(PlayerQuestionStatus.EXPIRED, expired.getStatus());
        assertEquals(expiredAt, expired.getExpiresAt());
        assertEquals(currentExpiresAt, current.getExpiresAt());
        verify(fixture.playerQuestionRepository).save(expired);
        verify(raceEngineService).applyTimeoutResult(racePlayer);
        verify(fixture.questionGenerationService).generate(any());
        verify(fixture.playerQuestionPersistenceService)
                .persistGeneratedQuestion(any(), any());
        verify(fixture.playerQuestionChoiceRepository, times(2))
                .findByPlayerQuestionOrderByDisplayOrderAsc(current);
        verify(gameplayPresenceService, times(2)).recordGameplayActivity(
                racePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        );
        verify(raceMovementService, never()).reanchorAt(any(), anyLong());
    }
}
