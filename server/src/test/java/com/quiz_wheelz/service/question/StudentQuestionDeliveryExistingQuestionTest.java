package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

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
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StudentQuestionDeliveryExistingQuestionTest {

    private StudentQuestionDeliveryTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentQuestionDeliveryTestFixture();
    }

    @Test
    void shouldReturnExistingActiveQuestionWhenNotExpired() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        PlayerQuestion activeQuestion = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                fixture.now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(activeQuestion);
        StudentQuestionResponse expected = fixture.createStudentQuestionResponse();
        prepareExistingQuestion(lockedRacePlayer, activeQuestion, choices, expected);

        StudentQuestionResponse result = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);

        assertSame(expected, result);
        verify(fixture.gameplayRequestGuard).requireGameplayAccess(
                lockedRacePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        );
        verify(fixture.racePlayerQuestionPlanService, never()).buildQuestionPlan(any());
        verify(fixture.questionGenerationService, never()).generate(any(QuestionPlan.class));
        verify(fixture.playerQuestionPersistenceService, never())
                .persistGeneratedQuestion(any(), any());
    }

    @Test
    void repeatedRequestShouldKeepQuestionAndOriginalDeadline() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        LocalDateTime expiresAt = fixture.now().plusSeconds(
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS
        );
        PlayerQuestion activeQuestion = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                expiresAt
        );
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(activeQuestion);
        StudentQuestionResponse expected = fixture.createStudentQuestionResponse();
        prepareExistingQuestion(lockedRacePlayer, activeQuestion, choices, expected);

        StudentQuestionResponse first = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);
        StudentQuestionResponse second = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);

        assertSame(expected, first);
        assertSame(expected, second);
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
    }

    @Test
    void shouldLockRacePlayerBeforeActiveQuestionLookup() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        PlayerQuestion question = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                fixture.now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        prepareExistingQuestion(
                lockedRacePlayer,
                question,
                fixture.createPlayerQuestionChoices(question),
                fixture.createStudentQuestionResponse()
        );

        fixture.studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer);

        InOrder order = inOrder(fixture.racePlayerRepository, fixture.playerQuestionRepository);
        order.verify(fixture.racePlayerRepository).findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        );
        order.verify(fixture.playerQuestionRepository)
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                );
    }

    @Test
    void shouldUseOneDecisionInstantForAccessAndServerTime() {
        Clock steppingClock = new Clock() {
            private long reads;

            @Override
            public ZoneId getZone() {
                return StudentQuestionDeliveryTestFixture.FIXED_ZONE;
            }

            @Override
            public Clock withZone(ZoneId zone) {
                return this;
            }

            @Override
            public Instant instant() {
                return StudentQuestionDeliveryTestFixture.FIXED_INSTANT
                        .plusMillis(5 * reads++);
            }
        };
        StudentQuestionDeliveryService service = new StudentQuestionDeliveryService(
                fixture.racePlayerRepository,
                fixture.playerQuestionRepository,
                fixture.playerQuestionChoiceRepository,
                fixture.racePlayerQuestionPlanService,
                fixture.questionGenerationService,
                fixture.playerQuestionPersistenceService,
                fixture.studentQuestionResponseMapper,
                fixture.gameplayRequestGuard,
                mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class),
                mock(com.quiz_wheelz.service.liveevent.RaceLiveMutationGate.class),
                steppingClock
        );
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        LocalDateTime expiresAt = fixture.now().plusSeconds(
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS
        );
        PlayerQuestion question = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                expiresAt
        );
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(question);
        prepareExistingQuestion(
                lockedRacePlayer,
                question,
                choices,
                fixture.createStudentQuestionResponse()
        );

        service.getOrCreateCurrentQuestion(racePlayer);

        verify(fixture.gameplayRequestGuard).requireGameplayAccess(
                lockedRacePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        );
        verify(fixture.studentQuestionResponseMapper).toResponse(
                question,
                choices,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT.toEpochMilli(),
                DateTimeUtils.toEpochMilli(
                        expiresAt,
                        StudentQuestionDeliveryTestFixture.FIXED_ZONE
                )
        );
    }

    @Test
    void shouldRejectMissingOrUnknownRacePlayer() {
        ApiException missing = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService.getOrCreateCurrentQuestion(null)
        );
        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, missing.getErrorCode());

        RacePlayer racePlayer = fixture.createRacePlayer();
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.empty());
        ApiException unknown = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(racePlayer)
        );
        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, unknown.getErrorCode());
    }

    @Test
    void shouldRejectGameplayWhenGuardRequiresReconnect() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(lockedRacePlayer));
        doThrow(new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED))
                .when(fixture.gameplayRequestGuard)
                .requireGameplayAccess(
                        lockedRacePlayer,
                        StudentQuestionDeliveryTestFixture.FIXED_INSTANT
                );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(racePlayer)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, exception.getErrorCode());
        verify(fixture.playerQuestionRepository, never())
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(any(), any());
    }

    private void prepareExistingQuestion(
            RacePlayer lockedRacePlayer,
            PlayerQuestion question,
            List<PlayerQuestionChoice> choices,
            StudentQuestionResponse response
    ) {
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(lockedRacePlayer));
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(question));
        when(fixture.playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(question))
                .thenReturn(choices);
        when(fixture.studentQuestionResponseMapper.toResponse(
                any(),
                any(),
                anyLong(),
                anyLong()
        )).thenReturn(response);
    }
}
