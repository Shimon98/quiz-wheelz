package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentQuestionDeliveryGenerationTest {

    private StudentQuestionDeliveryTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new StudentQuestionDeliveryTestFixture();
    }

    @Test
    void shouldGenerateAndPersistWhenNoActiveQuestionExists() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        QuestionPlan plan = fixture.createQuestionPlan();
        InternalGeneratedQuestion generated = fixture.createGeneratedQuestion();
        PlayerQuestion persisted = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                fixture.now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS)
        );
        List<PlayerQuestionChoice> choices = fixture.createPlayerQuestionChoices(persisted);
        StudentQuestionResponse expected = fixture.createStudentQuestionResponse();
        prepareGeneration(lockedRacePlayer, plan, generated, persisted, choices, expected);

        StudentQuestionResponse result = fixture.studentQuestionDeliveryService
                .getOrCreateCurrentQuestion(racePlayer);

        assertSame(expected, result);
        verify(fixture.gameplayRequestGuard).requireGameplayAccess(
                lockedRacePlayer,
                StudentQuestionDeliveryTestFixture.FIXED_INSTANT
        );
        verify(fixture.questionGenerationService).generate(plan);
        verify(fixture.playerQuestionPersistenceService)
                .persistGeneratedQuestion(lockedRacePlayer, generated);
    }

    @Test
    void shouldRejectPlayerThatFinishedWhileWaitingForLock() {
        RacePlayer requestPlayer = fixture.createRacePlayer();
        RacePlayer lockedPlayer = fixture.createRacePlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );
        prepareLockedPlayer(lockedPlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(requestPlayer)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
        verify(fixture.questionGenerationService, never()).generate(any());
    }

    @Test
    void shouldRejectPlayerWhoseRaceEndedWhileWaitingForLock() {
        RacePlayer requestPlayer = fixture.createRacePlayer();
        RacePlayer lockedPlayer = fixture.createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );
        prepareLockedPlayer(lockedPlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(requestPlayer)
        );

        assertEquals(ErrorCode.RACE_NOT_IN_PROGRESS, exception.getErrorCode());
        verify(fixture.questionGenerationService, never()).generate(any());
    }

    @Test
    void shouldRejectExistingQuestionWithoutExpiry() {
        RacePlayer racePlayer = fixture.createRacePlayer();
        RacePlayer lockedRacePlayer = fixture.createRacePlayer();
        PlayerQuestion active = fixture.createPlayerQuestion(
                PlayerQuestionStatus.ACTIVE,
                null
        );
        prepareLockedPlayer(lockedRacePlayer);
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(active));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> fixture.studentQuestionDeliveryService
                        .getOrCreateCurrentQuestion(racePlayer)
        );

        assertEquals(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG, exception.getErrorCode());
    }

    private void prepareGeneration(
            RacePlayer lockedRacePlayer,
            QuestionPlan plan,
            InternalGeneratedQuestion generated,
            PlayerQuestion persisted,
            List<PlayerQuestionChoice> choices,
            StudentQuestionResponse response
    ) {
        prepareLockedPlayer(lockedRacePlayer);
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.empty());
        when(fixture.racePlayerQuestionPlanService.buildQuestionPlan(lockedRacePlayer))
                .thenReturn(plan);
        when(fixture.questionGenerationService.generate(plan)).thenReturn(generated);
        when(fixture.playerQuestionPersistenceService.persistGeneratedQuestion(
                lockedRacePlayer,
                generated
        )).thenReturn(persisted);
        when(fixture.playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(persisted))
                .thenReturn(choices);
        when(fixture.studentQuestionResponseMapper.toResponse(
                any(),
                any(),
                anyLong(),
                anyLong()
        )).thenReturn(response);
    }

    private void prepareLockedPlayer(RacePlayer lockedRacePlayer) {
        when(fixture.racePlayerRepository.findLockedByIdAndRaceId(
                StudentQuestionDeliveryTestFixture.RACE_PLAYER_ID,
                StudentQuestionDeliveryTestFixture.RACE_ID
        )).thenReturn(Optional.of(lockedRacePlayer));
    }
}
